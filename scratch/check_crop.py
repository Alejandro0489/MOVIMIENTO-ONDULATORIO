from PIL import Image
import numpy as np

img = Image.open('Imagenes/Portada.png')
# Let's crop from y=680 to 1220, x=220 to 880
crop = img.crop((220, 680, 880, 1220))
crop.save('scratch/full_author_crop.png')
print('Crop size:', crop.size)

