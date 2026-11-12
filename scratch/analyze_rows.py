from PIL import Image
import numpy as np

img = Image.open('C:/Users/aleja/.gemini/antigravity/brain/c685bd5f-db9a-48e6-bf4b-ee7c57a7142b/.user_uploaded/media_1794065488533_12ee68ba.jpg')
arr = np.array(img)
h, w, c = arr.shape
print(f"Height: {h}, Width: {w}")

# The Windows taskbar is at the bottom. Where does it start?
# The taskbar is usually gray/dark with icons around y=70..126
# Let's inspect rows from top to bottom
for y in range(0, h, 10):
    print(f"y={y}: center rgb={arr[y, w//2]}")

