from PIL import Image

img = Image.open('Imagenes/Portada.png')
# Let's crop:
# Group 1 (y 715 to 960)
img.crop((280, 715, 820, 960)).save('scratch/grp1_authors.png')
# Group 2 (y 1065 to 1100)
img.crop((380, 1065, 720, 1100)).save('scratch/grp2_divider.png')
# Group 3 & 4 (y 1105 to 1160)
img.crop((320, 1105, 780, 1160)).save('scratch/grp3_4_semester.png')
# Group 5 (y 1165 to 1210)
img.crop((320, 1165, 780, 1210)).save('scratch/grp5_squiggle.png')
print('Saved grp crops')

