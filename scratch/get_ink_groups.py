from PIL import Image
import numpy as np

img = Image.open('Imagenes/Portada.png').convert('RGB')
arr = np.array(img)

# Let's inspect where the ink is in x=250..850, y=700..1200
# For each group of rows with ink, get min_x, max_x, min_y, max_y
ink = np.mean(arr, axis=2) < 170

groups = []
current = []
for y in range(700, 1200):
    xs = np.where(ink[y, 250:850])[0] + 250
    if len(xs) > 10:
        current.append((y, np.min(xs), np.max(xs)))
    else:
        if len(current) > 3:
            groups.append(current)
        current = []
if len(current) > 3:
    groups.append(current)

for idx, g in enumerate(groups):
    min_y = g[0][0]
    max_y = g[-1][0]
    min_x = min(item[1] for item in g)
    max_x = max(item[2] for item in g)
    print(f"Group {idx+1}: y=[{min_y}, {max_y}], x=[{min_x}, {max_x}]")

