
import os

path = "/Users/dulorai/tiktokGame/ArcadiaApp/src/components/GameCard.tsx"

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if 'injectedJavaScript={`' in line:
        new_lines.append(line)
        new_lines.append('                                // Config for game\n')
        new_lines.append('                                window.ARCADIA_CONFIG = ${JSON.stringify(game.config || {})};\n')
        new_lines.append('                                window.DURRA_CONFIG = ${JSON.stringify(game.config || {})};\n')
        new_lines.append('\n')
        new_lines.append('                                // Mobile touch optimization & Notch Support\n')
        new_lines.append('                                (function() {\n')
        new_lines.append("                                    var style = document.createElement('style');\n")
        new_lines.append("                                    style.innerHTML = ' * { touch-action: manipulation; -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; -webkit-tap-highlight-color: transparent; } ' +\n")
        new_lines.append("                                                      ' html, body { touch-action: manipulation; overflow: hidden; position: fixed; width: 100%; height: 100%; padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); background: #000; } ' +\n")
        new_lines.append("                                                      ' canvas { touch-action: none; } ';\n")
        new_lines.append('                                    document.head.appendChild(style);\n')
        new_lines.append('\n')
        new_lines.append('                                    // Prevent default touch behaviors that interfere\n')
        new_lines.append('                                    document.addEventListener(\'touchmove\', function(e) { e.preventDefault(); }, { passive: false });\n')
        new_lines.append('                                })();\n')
        new_lines.append('                                true;\n')
        new_lines.append('                            `}\n')
        skip = True
    elif skip and '`}' in line:
        skip = False
    elif not skip:
        new_lines.append(line)

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
