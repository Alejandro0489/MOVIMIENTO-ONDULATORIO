import re

with open('vendor/lucide.min.js', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

print('Has zoom:', 'zoom' in content)
print('Has rotate:', 'rotate' in content)
print('Has search:', 'search' in content)
print('Has plus:', 'plus' in content)
print('Has minus:', 'minus' in content)

# Check all keys matching icon definitions
matches = re.findall(r'([a-zA-Z0-9_-]+):\[\[', content)
print('Found matches count:', len(matches))
print('Sample matches:', matches[:30])

