with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

import re
stack = []
for i, line in enumerate(lines):
    tokens = re.findall(r'<(/?[a-zA-Z0-9-]+)([^>]*)>', line)
    for tag, attrs in tokens:
        if tag.startswith('/'):
            close_tag = tag[1:]
            if stack and stack[-1][0] == close_tag:
                stack.pop()
        else:
            if not attrs.endswith('/'):
                if tag not in ['link', 'meta', 'img', 'br', 'hr', 'input', 'source']:
                    id_match = re.search(r'id=[\"\']([^\"\']+)[\"\']', attrs)
                    class_match = re.search(r'class=[\"\']([^\"\']+)[\"\']', attrs)
                    tag_info = f"{tag}"
                    if id_match: tag_info += f"#{id_match.group(1)}"
                    if class_match: tag_info += f".{class_match.group(1).split()[0]}"
                    stack.append((tag, tag_info, i+1))

print("Unclosed tags at EOF:", len(stack))
for s in stack:
    print(f"  Line {s[2]}: <{s[1]}>")

