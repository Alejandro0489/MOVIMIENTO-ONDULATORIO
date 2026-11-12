from PIL import Image, ImageDraw, ImageFont
import numpy as np

# Load original
img = Image.open('Imagenes/Portada.png').convert('RGB')
arr = np.array(img, dtype=np.float32)

# We want to inpaint the area x in [270, 830], y in [715, 1160]
# Notice y=1165 to 1210 has the wave flourish squiggle ——/\/\/——. We can preserve the flourish!
# First, let's look at the background texture around this box.
# We can do bilinear interpolation of the parchment background + subtle authentic noise
# Let's sample the top border (y=700..714), bottom border (y=1160..1170),
# left border (x=260..275), right border (x=825..840)

y1, y2 = 715, 1160
x1, x2 = 270, 830
h = y2 - y1
w = x2 - x1

# Sample boundary strips to compute smooth gradient
top_strip = np.mean(arr[y1-15:y1, x1:x2], axis=0) # shape (w, 3)
bottom_strip = np.mean(arr[y2:y2+15, x1:x2], axis=0) # shape (w, 3)

# Linear blend from top to bottom
alpha = np.linspace(0, 1, h)[:, None, None]
gradient = (1 - alpha) * top_strip[None, :, :] + alpha * bottom_strip[None, :, :]

# Add genuine parchment noise / grain matching original std deviation
noise = np.random.normal(0, 2.2, (h, w, 3))
clean_patch = np.clip(gradient + noise, 0, 255).astype(np.uint8)

# Place patch back
img_clean = img.copy()
img_clean.paste(Image.fromarray(clean_patch), (x1, y1))

# Now let's draw the typography
draw = ImageDraw.Draw(img_clean)

# Load fonts
font_names = ImageFont.truetype('C:/Windows/Fonts/georgiab.ttf', 24)
font_subtitle = ImageFont.truetype('C:/Windows/Fonts/georgia.ttf', 16)
font_univ = ImageFont.truetype('C:/Windows/Fonts/georgia.ttf', 16)
font_dot = ImageFont.truetype('C:/Windows/Fonts/georgia.ttf', 16)

# Ink color sampled from original text: rgb(65, 52, 43) or dark antique bistre #35261d
ink_color = (52, 42, 34)

authors = [
    "DARLYN DAYANA ZAPATA",
    "JORGE ALEJANDRO GIRALDO",
    "SARA VÉLEZ ALZATE"
]

center_x = 551 # exactly half of 1103 width

# Draw Authors
curr_y = 750
for author in authors:
    # Add subtle letter spacing by rendering with spaces or centered
    bbox = draw.textbbox((0, 0), author, font=font_names)
    text_w = bbox[2] - bbox[0]
    draw.text((center_x - text_w // 2, curr_y), author, fill=ink_color, font=font_names)
    curr_y += 38

curr_y += 20
sub1 = "ESTUDIANTES DE INGENIERÍA EN SISTEMAS"
bbox1 = draw.textbbox((0, 0), sub1, font=font_subtitle)
draw.text((center_x - (bbox1[2] - bbox1[0]) // 2, curr_y), sub1, fill=ink_color, font=font_subtitle)

curr_y += 28
sub2 = "UNIVERSIDAD TECNOLÓGICA DE PEREIRA"
bbox2 = draw.textbbox((0, 0), sub2, font=font_univ)
draw.text((center_x - (bbox2[2] - bbox2[0]) // 2, curr_y), sub2, fill=ink_color, font=font_univ)

curr_y += 40
divider = "• ——— •"
bbox_div = draw.textbbox((0, 0), divider, font=font_dot)
draw.text((center_x - (bbox_div[2] - bbox_div[0]) // 2, curr_y), divider, fill=ink_color, font=font_dot)

# Notice: NO "SEMESTRE FACTORIAL"! Completely removed as requested!

img_clean.save('scratch/test_portada.png')
print('Successfully created scratch/test_portada.png')

