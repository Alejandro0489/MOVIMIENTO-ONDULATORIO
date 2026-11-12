from PIL import Image, ImageDraw, ImageFont
import numpy as np
import shutil

# 1. Backup original files
shutil.copyfile('Imagenes/Portada.png', 'scratch/Portada_orig_backup.png')
shutil.copyfile('Imagenes/Portada.webp', 'scratch/Portada_orig_backup.webp')

orig = Image.open('Imagenes/Portada.png').convert('RGB')
arr = np.array(orig, dtype=np.float32)

clean_arr = arr.copy()

bg_top = np.median(arr[700:715, 320:780], axis=0)
bg_bottom = np.median(arr[1162:1172, 320:780], axis=0)

y_indices = np.arange(720, 1160)
alpha = ((y_indices - 720) / (1160 - 720))[:, None, None]
bg_surface = (1 - alpha) * bg_top[None, :, :] + alpha * bg_bottom[None, :, :]

region = arr[720:1160, 320:780]
diff = np.linalg.norm(region - bg_surface, axis=2)
is_ink = (diff > 14) & (np.mean(region, axis=2) < np.mean(bg_surface, axis=2) - 8)

np.random.seed(42)
noise = np.random.normal(0, 2.0, bg_surface.shape)
replacement = np.clip(bg_surface + noise, 0, 255)

clean_region = np.where(is_ink[:, :, None], replacement, region)
clean_arr[720:1160, 320:780] = clean_region

img_clean = Image.fromarray(np.uint8(clean_arr))
draw = ImageDraw.Draw(img_clean)

font_names = ImageFont.truetype('C:/Windows/Fonts/georgiab.ttf', 24)
font_career = ImageFont.truetype('C:/Windows/Fonts/georgia.ttf', 16)
font_univ = ImageFont.truetype('C:/Windows/Fonts/georgia.ttf', 16)
font_dot = ImageFont.truetype('C:/Windows/Fonts/georgia.ttf', 17)

ink_color = (45, 36, 28)
center_x = 551

authors = [
    "DARLYN DAYANA ZAPATA",
    "JORGE ALEJANDRO GIRALDO",
    "SARA VÉLEZ ALZATE"
]

y_start = 760
for author in authors:
    bbox = draw.textbbox((0, 0), author, font=font_names)
    w = bbox[2] - bbox[0]
    draw.text((center_x - w // 2, y_start), author, fill=ink_color, font=font_names)
    y_start += 38

y_start += 22
line_career = "ESTUDIANTES DE INGENIERÍA EN SISTEMAS"
bbox_c = draw.textbbox((0, 0), line_career, font=font_career)
draw.text((center_x - (bbox_c[2] - bbox_c[0]) // 2, y_start), line_career, fill=ink_color, font=font_career)

y_start += 28
line_univ = "UNIVERSIDAD TECNOLÓGICA DE PEREIRA"
bbox_u = draw.textbbox((0, 0), line_univ, font=font_univ)
draw.text((center_x - (bbox_u[2] - bbox_u[0]) // 2, y_start), line_univ, fill=ink_color, font=font_univ)

y_start += 36
dot_flourish = "• ——— •"
bbox_d = draw.textbbox((0, 0), dot_flourish, font=font_dot)
draw.text((center_x - (bbox_d[2] - bbox_d[0]) // 2, y_start), dot_flourish, fill=ink_color, font=font_dot)

# Save to both Portada.png and Portada.webp
img_clean.save('Imagenes/Portada.png', format='PNG')
img_clean.save('Imagenes/Portada.webp', format='WEBP', quality=95)
print('Successfully updated Imagenes/Portada.png and Imagenes/Portada.webp')

