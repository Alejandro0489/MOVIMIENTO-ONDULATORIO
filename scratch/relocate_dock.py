with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

dock_comment = '<!-- ========================================================================\n         BARRA DOCK INFERIOR DE NAVEGACIÓN Y DESPLAZAMIENTO'
dock_start = text.find(dock_comment)
if dock_start == -1:
    dock_start = text.find('<div class="navigation-dock-container" id="global-page-dock"')

dock_end = text.find('</main>', dock_start)
dock_full = text[dock_start:dock_end].strip()

# Remove dock and the extra </main> from bottom
text_no_dock = text[:dock_start] + text[dock_end + len('</main>'):]

# Find where page-16 ends
target = '</section>\n\n      </div>\n    </div>'
if target not in text_no_dock:
    # try flexible regex
    import re
    m = re.search(r'</section>\s*</div>\s*</div>\s*<!-- =+\s*MODAL: EQUIPO', text_no_dock)
    print('Regex match:', m)
    span = m.span()
    replacement = '</section>\n\n        ' + dock_full + '\n      </div>\n    </main>\n\n    <!-- ='
    text_final = text_no_dock[:span[0]] + replacement + text_no_dock[span[1]-len('<!-- ='):]
else:
    replacement = '</section>\n\n        ' + dock_full + '\n      </div>\n    </main>'
    text_final = text_no_dock.replace(target, replacement, 1)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text_final)

print('Successfully relocated dock inside .notebook-viewport and closed main properly!')

