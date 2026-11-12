from PIL import Image
import numpy as np

img = Image.open('scratch/preview_new_cover.png')
print('Preview image size:', img.size)

# Check the region around where SEMESTRE FACTORIAL was (y around 1100 to 1160 in original coords, in crop y is -680)
# In crop, y=1100..1160 corresponds to y_crop = 420..480
arr = np.array(img)
sem_area = arr[420:480, 100:560]
print('Semestre area mean:', np.mean(sem_area, axis=(0,1)))
print('Semestre area min:', np.min(sem_area, axis=(0,1)))

