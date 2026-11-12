from PIL import Image

img = Image.open('C:/Users/aleja/.gemini/antigravity/brain/c685bd5f-db9a-48e6-bf4b-ee7c57a7142b/.user_uploaded/media_1794065488533_12ee68ba.jpg')
print('Image size:', img.size)

# Right edge
w, h = img.size
right_crop = img.crop((w - 100, 0, w, h))
right_crop.save('scratch/img_right_edge.png')

# Center crop
center_crop = img.crop((w // 2 - 300, 0, w // 2 + 300, h))
center_crop.save('scratch/img_center.png')

print('Saved crops')

