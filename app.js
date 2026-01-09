const config = {
    count: 200,
    radius: 250,
    autoRotateSpeed: 0.002,
    dragSensitivity: 0.005,
    inertiaDecay: 0.95
};

// Image bank - using SVG files from SVG BANK folder
const imageBank = [
    'SVG%20BANK/Artboard%203.svg',
    'SVG%20BANK/Artboard%203%20copy.svg',
    'SVG%20BANK/Artboard%203%20copy%202.svg',
    'SVG%20BANK/Artboard%203%20copy%203.svg',
    'SVG%20BANK/Artboard%203%20copy%204.svg',
    'SVG%20BANK/Artboard%203%20copy%205.svg',
    'SVG%20BANK/Artboard%203%20copy%206.svg',
    'SVG%20BANK/Artboard%203%20copy%207.svg',
    'SVG%20BANK/Artboard%203%20copy%208.svg',
    'SVG%20BANK/Artboard%203%20copy%209.svg',
    'SVG%20BANK/Artboard%203%20copy%2010.svg',
    'SVG%20BANK/Artboard%203%20copy%2011.svg',
    'SVG%20BANK/Artboard%203%20copy%2012.svg',
    'SVG%20BANK/Artboard%203%20copy%2013.svg',
    'SVG%20BANK/Artboard%203%20copy%2014.svg',
    'SVG%20BANK/Artboard%203%20copy%2015.svg',
    'SVG%20BANK/Artboard%203%20copy%2016.svg',
    'SVG%20BANK/Artboard%203%20copy%2017.svg',
    'SVG%20BANK/Artboard%203%20copy%2018.svg',
    'SVG%20BANK/Artboard%203%20copy%2019.svg',
    'SVG%20BANK/Artboard%203%20copy%2020.svg',
    'SVG%20BANK/Artboard%203%20copy%2021.svg',
    'SVG%20BANK/Artboard%203%20copy%2022.svg',
    'SVG%20BANK/Artboard%203%20copy%2023.svg'
];

const state = {
    rotation: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 }, // For inertia
    isDragging: false,
    lastMouse: { x: 0, y: 0 },
    items: [] // Will hold element references and their initial 3D positions
};

const dom = {
    container: document.getElementById('sphere'),
    items: []
};


// --- Math & Geometry ---

// Generate points on a sphere using Fibonacci Spiral algorithm
function getFibonacciSpherePoints(count, radius) {
    const points = [];
    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    for (let i = 0; i < count; i++) {
        // y goes from 1 to -1
        const y = 1 - (i / (count - 1)) * 2;
        // Radius at y
        const radiusAtY = Math.sqrt(1 - y * y);

        const theta = (2 * Math.PI * i) / goldenRatio;

        const x = Math.cos(theta) * radiusAtY;
        const z = Math.sin(theta) * radiusAtY; // Z is depth here

        points.push({
            x: x * radius,
            y: y * radius,
            z: z * radius
        });
    }
    return points;
}

// 3D Matrix Rotation
function rotatePoint(p, rx, ry) {
    let { x, y, z } = p;

    // Rotate around X axis
    // y' = y*cos(rx) - z*sin(rx)
    // z' = y*sin(rx) + z*cos(rx)
    const cosX = Math.cos(rx);
    const sinX = Math.sin(rx);
    const y1 = y * cosX - z * sinX;
    const z1 = y * sinX + z * cosX;
    y = y1;
    z = z1;

    // Rotate around Y axis
    // x' = x*cos(ry) + z*sin(ry)
    // z' = -x*sin(ry) + z*cos(ry)
    const cosY = Math.cos(ry);
    const sinY = Math.sin(ry);
    const x2 = x * cosY + z * sinY;
    const z2 = -x * sinY + z * cosY;
    x = x2;
    z = z2;

    return { x, y, z };
}


// --- Initialization ---

function init() {
    const points = getFibonacciSpherePoints(config.count, config.radius);

    // Average spacing calculation to determine neighbor threshold
    // Surface area = 4 * pi * r^2
    // Area per point = Surface area / count
    // Approx spacing = sqrt(Area per point)
    // We'll multiply by a factor (e.g. 1.5) to cover immediate diagonals
    const surfaceArea = 4 * Math.PI * config.radius * config.radius;
    const areaPerPoint = surfaceArea / config.count;
    const neighborThreshold = Math.sqrt(areaPerPoint) * 1.5;
    const neighborThresholdSq = neighborThreshold * neighborThreshold;

    points.forEach((p, i) => {
        const el = document.createElement('div');
        el.className = 'item';

        // Find neighbors among already created items
        const neighborImageIndices = new Set();
        state.items.forEach(existingItem => {
            const dx = p.x - existingItem.initial.x;
            const dy = p.y - existingItem.initial.y;
            const dz = p.z - existingItem.initial.z;
            const distSq = dx * dx + dy * dy + dz * dz;

            if (distSq < neighborThresholdSq) {
                neighborImageIndices.add(existingItem.imageIndex);
            }
        });

        // Pick a random image that isn't a neighbor
        let imageIndex;
        let attempts = 0;
        do {
            imageIndex = Math.floor(Math.random() * imageBank.length);
            attempts++;
        } while (neighborImageIndices.has(imageIndex) && attempts < 50);

        el.style.backgroundImage = `url('${imageBank[imageIndex]}')`;

        dom.container.appendChild(el);

        state.items.push({
            initial: p,
            current: { ...p },
            element: el,
            imageIndex: imageIndex // Store index for future checks
        });
    });

    // Start Loop
    loop();

    // Event Listeners
    window.addEventListener('mousedown', onDragStart);
    window.addEventListener('touchstart', onDragStart, { passive: false });

    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('touchmove', onDragMove, { passive: false });

    window.addEventListener('mouseup', onDragEnd);
    window.addEventListener('touchend', onDragEnd);
}

// --- Interaction ---

function onDragStart(e) {
    // Don't start dragging if mouse is over controls panel
    const controlsPanel = document.getElementById('controls-panel');
    const target = e.target;
    if (controlsPanel && controlsPanel.contains(target)) {
        return;
    }

    state.isDragging = true;
    state.velocity = { x: 0, y: 0 }; // Stop inertia

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    state.lastMouse = { x: clientX, y: clientY };
}

function onDragMove(e) {
    if (!state.isDragging) return;
    if (e.cancelable) e.preventDefault(); // Prevent scrolling on touch

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - state.lastMouse.x;
    const deltaY = clientY - state.lastMouse.y;

    // Update velocity based on drag speed
    state.velocity.y = deltaX * config.dragSensitivity;
    state.velocity.x = -deltaY * config.dragSensitivity; // Invert Y for intuition

    state.rotation.y += state.velocity.y;
    state.rotation.x += state.velocity.x;

    state.lastMouse = { x: clientX, y: clientY };
}

function onDragEnd() {
    state.isDragging = false;
}


// --- Render Loop ---

function loop() {
    requestAnimationFrame(loop);

    // Apply Inertia
    if (!state.isDragging) {
        state.rotation.y += state.velocity.y;
        state.rotation.x += state.velocity.x;

        // Decay velocity
        state.velocity.x *= config.inertiaDecay;
        state.velocity.y *= config.inertiaDecay;

        // Auto-rotation fallback if velocity is low
        if (Math.abs(state.velocity.y) < 0.0001 && Math.abs(state.velocity.x) < 0.0001) {
            state.rotation.y += config.autoRotateSpeed;
        }
    }

    state.items.forEach(item => {
        // Calculated rotated position
        const p = rotatePoint(item.initial, state.rotation.x, state.rotation.y);
        item.current = p;

        // Apply visual updates based on Depth (z)
        // z varies from -radius to +radius
        // We map this to scale (0.5 to 1.5) and opacity (0.3 to 1) 
        // to create depth illusion without actual CSS perpective on each child if we don't want it,
        // BUT here we use translate3d so we get real perspective from the container.
        // We will just enhance it with scale/opacity.

        // const scale = (p.z + config.radius * 2) / (config.radius * 2.5); // Crude depth map
        const opacity = (p.z + config.radius) / (config.radius * 2);
        const zIndex = Math.floor(p.z + config.radius);

        const brightness = 50 + (50 * (p.z + config.radius) / (config.radius * 2));

        item.element.style.transform = `translate3d(${p.x}px, ${p.y}px, ${p.z}px) scale(${0.5 + opacity / 2})`;
        item.element.style.zIndex = zIndex;
        // item.element.style.opacity = 0.2 + (opacity * 0.8);
        item.element.style.filter = `brightness(${brightness}%)`;
    });
}

// --- UI Controls ---

function setupControls() {
    const controlsPanel = document.getElementById('controls-panel');
    const spacingSlider = document.getElementById('spacing-slider');
    const spacingValue = document.getElementById('spacing-value');
    const sizeSlider = document.getElementById('size-slider');
    const sizeValue = document.getElementById('size-value');
    const bgColor = document.getElementById('bg-color');

    // Spacing slider
    spacingSlider.addEventListener('input', (e) => {
        const newRadius = parseInt(e.target.value);
        config.radius = newRadius;
        spacingValue.textContent = newRadius;

        // Recalculate positions
        const points = getFibonacciSpherePoints(config.count, config.radius);
        state.items.forEach((item, i) => {
            item.initial = points[i];
        });
    });

    // Size slider
    sizeSlider.addEventListener('input', (e) => {
        const newSize = parseInt(e.target.value);
        sizeValue.textContent = newSize;

        // Update all item sizes
        state.items.forEach(item => {
            item.element.style.width = newSize + 'px';
            item.element.style.height = newSize + 'px';
            item.element.style.top = -(newSize / 2) + 'px';
            item.element.style.left = -(newSize / 2) + 'px';
        });
    });

    // Background color
    bgColor.addEventListener('input', (e) => {
        document.body.style.backgroundColor = e.target.value;
    });

    // Keyboard shortcut to toggle controls (U key)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'u' || e.key === 'U') {
            controlsPanel.classList.toggle('hidden');
        }
    });
}

// Initialize the sphere when the page loads
init();
setupControls();
