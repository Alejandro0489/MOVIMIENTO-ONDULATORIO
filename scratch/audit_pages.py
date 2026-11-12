import subprocess, os, time, json
from PIL import Image
import numpy as np

edge = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
cwd = os.getcwd()

# Let's create a test script that navigates through pages and tests each one
with open('index.html', 'r', encoding='utf-8') as f:
    orig_html = f.read()

# Test script to verify each page
for page in [0, 1, 2, 7, 8, 9, 15, 16]:
    inject = f"""
    <script>
    window.addEventListener('DOMContentLoaded', () => {{
      setTimeout(() => {{
        if (window.notebookApp) {{
          window.notebookApp.goToPage({page}, false);
          console.log('PAGE {page} LOADED');
        }}
      }}, 350);
    }});
    </script>
    </body>
    """
    thtml = orig_html.replace('</body>', inject)
    tname = f'test_page_{page}.html'
    with open(tname, 'w', encoding='utf-8') as f:
        f.write(thtml)
    
    out_png = os.path.join(cwd, 'scratch', f'audit_page_{page}.png')
    cmd = [
        edge,
        '--headless',
        '--disable-gpu',
        '--window-size=1280,1000',
        '--virtual-time-budget=2000',
        '--screenshot=' + out_png,
        'file:///' + cwd.replace('\\', '/') + '/' + tname
    ]
    subprocess.run(cmd, check=True)
    if os.path.exists(tname):
        os.remove(tname)
    
    img = Image.open(out_png)
    arr = np.array(img)
    # Check if page is blank or has content
    std = np.std(arr)
    print(f'Page {page}: screenshot saved, std={std:.1f}, size={img.size}')

print('All audit screenshots generated!')

