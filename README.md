# SymbolSphere

An interactive 3D sphere built with vanilla JavaScript, populated with custom SVG illustrations that float and rotate in space.

## What's Inside

```
SymbolSphere/
├── index.html              # Main entry point
├── app.js                  # Sphere logic, animation, controls
├── SVG BANK/               # 58 SVG illustrations displayed on the sphere
└── presentation-build/     # Static build assets
```

## How It Works

- Illustrations are distributed across the sphere surface using the **Fibonacci spiral algorithm** for even spacing
- The sphere auto-rotates and responds to **click-and-drag** (mouse and touch)
- Depth-based **opacity and brightness** create a 3D feel — items fade as they move to the back
- Neighboring positions always show different images to avoid repeats

## Running Locally

No build step needed — open `index.html` directly in a browser, or serve the folder with any static server:

```bash
npx serve .
```

## Controls Panel

Press **U** to toggle the settings panel, which lets you adjust:

| Control | What it does |
|---------|-------------|
| Density | Number of items on the sphere (default: 50) |
| Spacing | Sphere radius / spread |
| Size | Size of each illustration |
| Background | Background color picker |

## SVG Assets

The `SVG BANK/` folder contains 58 hand-drawn illustrations. The sphere randomly picks from these, ensuring no two adjacent items show the same image.
