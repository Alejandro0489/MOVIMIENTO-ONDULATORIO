from PIL import Image
import numpy as np

img = Image.open('scratch/test_portada.png').convert('RGB')
arr = np.array(img, dtype=np.float32)

y1, y2 = 715, 1160
x1, x2 = 270, 830

# Check difference at top seam (y1-1 vs y1)
top_diff = np.mean(np.abs(arr[y1-1, x1:x2] - arr[y1, x1:x2]))
bottom_diff = np.mean(np.abs(arr[y2, x1:x2] - arr[y2+1, x1:x2]))
left_diff = np.mean(np.abs(arr[y1:y2, x1-1] - arr[y1:y2, x1]))
right_diff = np.mean(np.abs(arr[y1:y2, x2] - arr[y1:y2, x2+1]))

print(f"Seam diffs - Top: {top_diff:.2f}, Bottom: {bottom_diff:.2f}, Left: {left_diff:.2f}, Right: {right_diff:.2f}")

# Crop and save for visual inspection
img.crop((220, 680, 880, 1250)).save('scratch/test_portada_crop.png')
print("Saved scratch/test_portada_crop.png")

