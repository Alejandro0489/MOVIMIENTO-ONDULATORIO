from PIL import Image
import numpy as np

img = Image.open('Imagenes/Portada.png').convert('RGB')
arr = np.array(img)

# Search in x in [300, 800], y in [700, 1200]
sub = arr[700:1200, 300:800]
# Parchment is around rgb(225, 203, 174)
# Ink is dark: mean rgb < 150
ink_mask = np.mean(sub, axis=2) < 160

# Let's see horizontal projection of ink
y_proj = np.sum(ink_mask, axis=1)
for i in range(len(y_proj)):
    if y_proj[i] > 10:
        print(f"y={700+i}, ink count={y_proj[i]}")

