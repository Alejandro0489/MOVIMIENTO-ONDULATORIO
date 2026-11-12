from PIL import Image
import numpy as np

img = Image.open('scratch/user_b7e_crop.png')
print('Crop size:', img.size)

# Let's inspect the text
# In scratch/user_b7e_crop.png, let's see what rows have dark text
arr = np.array(img.convert('RGB'))
# Let's print out the crop dimensions and save a snippet of the text
text_snippet = img.crop((50, 0, 450, 200))
text_snippet.save('scratch/text_snippet_from_user.png')
print('Saved scratch/text_snippet_from_user.png')

