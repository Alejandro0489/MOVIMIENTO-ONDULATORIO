with open('vendor/lucide.min.js', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

idx = text.find('createIcons')
print(text[idx-200:idx+400])

