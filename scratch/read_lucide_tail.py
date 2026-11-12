with open('vendor/lucide.min.js', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

import re
# check exports at the end
print('End of file:', text[-1000:])

