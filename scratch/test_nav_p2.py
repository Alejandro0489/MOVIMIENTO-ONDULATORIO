import subprocess, os, re
from PIL import Image
import numpy as np

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Add script at bottom to immediately navigate to page 2
script_nav = """
<script>
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (window.notebookApp) {
      window.notebookApp.goToPage(2, false);
      console.log('Navigated to page 2!');
    }
  }, 300);
});
</script>
</body>
"""
test_html = text.replace('</body>', script_nav)

with open('test_nav_p2.html', 'w', encoding='utf-8') as f:
    f.write(test_html)

edge = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
cwd = os.getcwd()
file_url = 'file:///' + cwd.replace('\\', '/') + '/test_nav_p2.html'
out_png = os.path.join(cwd, 'scratch', 'screen_nav_p2.png')

cmd = [
    edge,
    '--headless',
    '--disable-gpu',
    '--window-size=1280,1200',
    '--virtual-time-budget=2000',
    '--screenshot=' + out_png,
    file_url
]
subprocess.run(cmd, check=True)
print('Screenshot taken successfully!')

img = Image.open(out_png)
arr = np.array(img)
# Let's count colors inside image
gold = np.sum((arr[:, :, 0] > 160) & (arr[:, :, 1] > 120) & (arr[:, :, 2] < 70))
blue = np.sum((arr[:, :, 2] > 160) & (arr[:, :, 0] < 80))
white = np.sum(np.all(arr > 220, axis=2))
print(f'Colors after goToPage(2): gold={gold}, blue={blue}, white={white}')

