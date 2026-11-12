from PIL import Image
import numpy as np

img = Image.open('Imagenes/Portada.png').convert('RGB')
arr = np.array(img)

# Let's inspect the exact lines and bounds
# Let's find background patches to clone/inpaint
# At x=150..250 and x=850..950, y=700..1200, there is pure parchment texture!
print('Left bg sample mean:', np.mean(arr[750:1150, 100:250], axis=(0,1)))
print('Right bg sample mean:', np.mean(arr[750:1150, 850:1000], axis=(0,1)))

