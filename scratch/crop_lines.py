from PIL import Image

img = Image.open('Imagenes/Portada.png')
# Line 1: y 720 to 800
img.crop((300, 720, 800, 800)).save('scratch/line1.png')
# Line 2: y 800 to 870
img.crop((300, 800, 800, 870)).save('scratch/line2.png')
# Line 3: y 870 to 950
img.crop((300, 870, 800, 950)).save('scratch/line3.png')
# Divider & Semester: y 1050 to 1160
img.crop((300, 1050, 800, 1160)).save('scratch/line4_semester.png')
# Squiggle: y 1160 to 1200
img.crop((300, 1160, 800, 1200)).save('scratch/line5_squiggle.png')
print('Cropped lines 1-5')

