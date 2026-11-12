from PIL import Image
import numpy as np

img = Image.open('Imagenes/Portada.png').convert('RGB')
arr = np.array(img)

crop_above = img.crop((320, 600, 780, 710))
crop_above.save('scratch/crop_above.png')
print('Crop above mean:', np.mean(np.array(crop_above), axis=(0,1)))
print('Crop above std:', np.std(np.array(crop_above), axis=(0,1)))

# Let's check below the squiggle: y=1200..1280
crop_below = img.crop((320, 1200, 780, 1280))
crop_below.save('scratch/crop_below.png')
print('Crop below mean:', np.mean(np.array(crop_below), axis=(0,1)))

