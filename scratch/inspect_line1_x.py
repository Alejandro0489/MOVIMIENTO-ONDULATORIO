from PIL import Image
import numpy as np

img = Image.open('Imagenes/Portada.png').convert('RGB')
arr = np.array(img)

# Let's inspect line 1 across all x
crop = arr[740:785, 200:900]
ink = np.mean(crop, axis=2) < 170
x_proj = np.sum(ink, axis=0)
for idx, count in enumerate(x_proj):
    x = 200 + idx
    if count > 2:
        print(f"x={x}, count={count}")

