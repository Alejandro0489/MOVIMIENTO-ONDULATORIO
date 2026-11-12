with open('vendor/lucide.min.js', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

idx = text.find('Please provide an icons object')
print(text[idx-250:idx+150])

