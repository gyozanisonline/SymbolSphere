import cv2
import numpy as np
import os

# Input and Output paths
INPUT_IMAGE = "/Users/gyozan/.gemini/antigravity/brain/e086aaa1-925a-4345-8063-5d2fa5279b99/uploaded_image_1767891504365.jpg"
OUTPUT_DIR = "/Users/gyozan/.gemini/antigravity/playground/neon-planetoid/assets"

def process_image():
    # 1. Read Image
    img = cv2.imread(INPUT_IMAGE)
    if img is None:
        print(f"Error: Could not read image at {INPUT_IMAGE}")
        return

    # 2. Convert to Grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 3. Threshold to get black parts
    # The background is light grey (~230), drawings are black/dark.
    # INVERT so drawings are white (255) and background is black (0) for contour finding
    # Using simple binary threshold: below 180 is drawing (255), above is background (0)
    _, thresh = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)

    # 4. Find Contours
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    print(f"Found {len(contours)} potential contours.")

    count = 0
    for cnt in contours:
        # Filter small noise
        area = cv2.contourArea(cnt)
        if area < 500: # Adjust this threshold based on symbol size
            continue

        # Get bounding box
        x, y, w, h = cv2.boundingRect(cnt)
        
        # Add a small padding
        pad = 5
        x = max(0, x - pad)
        y = max(0, y - pad)
        w = w + 2*pad
        h = h + 2*pad

        # Crop the ROI from original image
        roi = img[y:y+h, x:x+w]

        # 5. Make Transparent
        # Create an Alpha channel based on brightness
        # Pixels that are dark (drawings) should be opaque. Light pixels transparent.
        roi_gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        
        # Create alpha mask: 
        #   - 255 (white) = Opaque
        #   - 0 (black) = Transparent
        # In the original, background is light (high val), drawing is dark (low val).
        
        # Simple binary alpha: if pixel is darker than 200, alpha = 255, else 0
        _, alpha = cv2.threshold(roi_gray, 200, 255, cv2.THRESH_BINARY_INV)
        
        # Refine mask with dilation/erosion to fill holes or clean edges if needed
        # kernel = np.ones((2,2),np.uint8)
        # alpha = cv2.morphologyEx(alpha, cv2.MORPH_CLOSE, kernel)

        # Split channels of ROI
        b, g, r = cv2.split(roi)
        
        # Merge with alpha
        rgba = cv2.merge([b, g, r, alpha])

        # Save
        filename = f"symbol_{count}.png"
        cv2.imwrite(os.path.join(OUTPUT_DIR, filename), rgba)
        count += 1

    print(f"Successfully saved {count} symbols to {OUTPUT_DIR}")

if __name__ == "__main__":
    process_image()
