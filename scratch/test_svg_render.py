import subprocess, os, re
from PIL import Image
import numpy as np

with open('test_p2.html', 'r', encoding='utf-8') as f:
    text = f.read()

m = re.search(r'(<div class="mindmap-container" id="mindmap-interactive-container">.*?</div>\s*</div>)', text, re.DOTALL)
if not m:
    m = re.search(r'(<div class="mindmap-container".*?</div>)', text, re.DOTALL)

svg_box = m.group(0)

html = """<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="css/main.css">
  <link rel="stylesheet" href="css/notebook.css">
  <link rel="stylesheet" href="css/components.css">
</head>
<body style="background:#111; padding:20px;">
""" + svg_box + """
</body>
</html>"""

with open('test_svg_only.html', 'w', encoding='utf-8') as f:
    f.write(html)

edge = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
cwd = os.getcwd()
file_url = 'file:///' + cwd.replace('\\', '/') + '/test_svg_only.html'
out_png = os.path.join(cwd, 'scratch', 'screen_svg_only.png')

cmd = [
    edge,
    '--headless',
    '--disable-gpu',
    '--window-size=1000,700',
    '--screenshot=' + out_png,
    file_url
]
subprocess.run(cmd, check=True)
print('Screenshot taken successfully!')

img = Image.open(out_png)
arr = np.array(img)
# Count bright / colorful pixels
gold = np.sum((arr[:, :, 0] > 160) & (arr[:, :, 1] > 120) & (arr[:, :, 2] < 70))
blue = np.sum((arr[:, :, 2] > 160) & (arr[:, :, 0] < 80))
white = np.sum(np.all(arr > 220, axis=2))
print(f'Colors in SVG-only: gold={gold}, blue={blue}, white={white}')

