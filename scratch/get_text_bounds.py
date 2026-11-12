from PIL import Image
import numpy as np

img = Image.open('Imagenes/Portada.png').convert('RGB')
arr = np.array(img)

# In original image, check where ALEJANDRO GIRALDO is
crop1 = arr[740:800, 300:800]
ink1 = np.mean(crop1, axis=2) < 170
x_ink = np.where(ink1)[1] + 300
print("Line 1 (ALEJANDRO GIRALDO) x range:", np.min(x_ink), np.max(x_ink))

# Line 2 (ESTUDIANTE DE INGENIERIA)
crop2 = arr[810:870, 300:800]
ink2 = np.mean(crop2, axis=2) < 170
x_ink2 = np.where(ink2)[1] + 300
print("Line 2 (ESTUDIANTE...) x range:", np.min(x_ink2), np.max(x_ink2))

# Line 3 (UNIVERSIDAD TECNOLOGICA)
crop3 = arr[870:940, 300:800]
ink3 = np.mean(crop3, axis=2) < 170
x_ink3 = np.where(ink3)[1] + 300
print("Line 3 (UNIVERSIDAD...) x range:", np.min(x_ink3), np.max(x_ink3))

# Divider • ——— •
crop_div = arr[1065:1095, 300:800]
ink_div = np.mean(crop_div, axis=2) < 170
x_ink_div = np.where(ink_div)[1] + 300
print("Divider x range:", np.min(x_ink_div), np.max(x_ink_div))

# SEMESTRE FACTORIAL
crop_sem = arr[1110:1155, 300:800]
ink_sem = np.mean(crop_sem, axis=2) < 170
x_ink_sem = np.where(ink_sem)[1] + 300
print("SEMESTRE FACTORIAL x range:", np.min(x_ink_sem), np.max(x_ink_sem))

