from PIL import Image
import numpy as np

for fname in ['Imagenes/Portada.png', 'Imagenes/Portada.webp']:
    img = Image.open(fname)
    print(f"=== {fname} ===")
    print("Dimensions:", img.size)
    # Check region y=700..1200, x=300..800
    arr = np.array(img.convert('RGB'))
    crop = img.crop((300, 700, 800, 1200))
    crop.save(f"scratch/verify_{fname.split('/')[-1].replace('.', '_')}.png")
    
    # Check ink rows in y=1050..1170
    sub = arr[1050:1170, 320:780]
    darkness = 255 - np.mean(sub, axis=2)
    ink_counts = np.sum(darkness > 70, axis=1)
    for idx, count in enumerate(ink_counts):
        if count > 10:
            print(f"  y={1050+idx}: ink count={count}")
    print("Checked ink rows.")

