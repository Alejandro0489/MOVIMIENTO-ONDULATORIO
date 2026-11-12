from PIL import Image, ImageDraw, ImageFont
import numpy as np

# Load original
orig = Image.open('Imagenes/Portada.png').convert('RGB')
arr = np.array(orig, dtype=np.float32)

# Create a clean version
clean_arr = arr.copy()

# For any y in [720, 1160] and x in [320, 780]:
# If pixel is ink (darker than parchment), replace it with the parchment background
# We can estimate the parchment background at (y, x) by interpolating from un-inked pixels nearby
bg_top = np.median(arr[700:715, 320:780], axis=0) # shape (460, 3)
bg_bottom = np.median(arr[1162:1172, 320:780], axis=0) # shape (460, 3)

y_indices = np.arange(720, 1160)
alpha = ((y_indices - 720) / (1160 - 720))[:, None, None]
# Estimated background surface across the rectangle
bg_surface = (1 - alpha) * bg_top[None, :, :] + alpha * bg_bottom[None, :, :]

# For every pixel in x in [320, 780], y in [720, 1160]:
# Ink threshold: if distance to bg_surface is significant or brightness < 195
region = arr[720:1160, 320:780]
diff = np.linalg.norm(region - bg_surface, axis=2)
# Ink pixels have diff > 15 and region is darker than bg
is_ink = (diff > 14) & (np.mean(region, axis=2) < np.mean(bg_surface, axis=2) - 8)

# Add genuine microtexture/noise to replaced pixels
np.random.seed(42)
noise = np.random.normal(0, 2.0, bg_surface.shape)
replacement = np.clip(bg_surface + noise, 0, 255)

clean_region = np.where(is_ink[:, :, None], replacement, region)
clean_arr[720:1160, 320:780] = clean_region

img_clean = Image.fromarray(np.uint8(clean_arr))

# Now let's draw the authors onto this perfectly cleaned parchment!
draw = ImageDraw.Draw(img_clean)

# Load Georgia Bold and Georgia Regular
font_names = ImageFont.truetype('C:/Windows/Fonts/georgiab.ttf', 24)
font_career = ImageFont.truetype('C:/Windows/Fonts/georgia.ttf', 16)
font_univ = ImageFont.truetype('C:/Windows/Fonts/georgia.ttf', 16)
font_dot = ImageFont.truetype('C:/Windows/Fonts/georgia.ttf', 17)

ink_color = (45, 36, 28) # deep bistre ink matching original

center_x = 551

# 1. Names of all authors:
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
    y_start += 40

y_start += 24
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

# Notice: SEMESTRE FACTORIAL is COMPLETELY OMITTED!
# And the squiggle flourish below y=1176 is 100% intact!

# Save preview
img_clean.crop((220, 680, 880, 1250)).save('scratch/preview_new_cover.png')
print('Preview saved to scratch/preview_new_cover.png')

