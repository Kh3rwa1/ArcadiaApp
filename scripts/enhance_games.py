import os
import re

GAMES_DIR = "/Users/dulorai/tiktokGame/public/games"
SHARED_SDK_PATH = "../_shared/durra-bridge.js"

def enhance_game(index_path):
    print(f"Enhancing: {index_path}")
    
    # Calculate depth to public/games
    rel_to_games = os.path.relpath(GAMES_DIR, os.path.dirname(index_path))
    sdk_rel_path = os.path.join(rel_to_games, "_shared", "durra-bridge.js")
    
    with open(index_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update Viewport & Performance CSS
    viewport_pattern = r'<meta name="viewport"[^>]*>'
    new_viewport = '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">'
    perf_style = """
    <style>
        * { -webkit-tap-highlight-color: transparent; -webkit-touch-callout: none; }
        canvas { transform: translateZ(0); backface-visibility: hidden; perspective: 1000; }
    </style>
    """
    if re.search(viewport_pattern, content):
        content = re.sub(viewport_pattern, new_viewport, content)
    else:
        content = re.sub(r'<head>', f'<head>\n    {new_viewport}', content, flags=re.IGNORECASE)

    if '</style>' in content:
        content = content.replace('</style>', f'        canvas {{ transform: translateZ(0); backface-visibility: hidden; }}\n    </style>')
    else:
        content = content.replace('</head>', f'{perf_style}\n</head>')

    # 2. Inject Bridge SDK
    if 'durra-bridge.js' not in content and 'arcadia-bridge.js' not in content:
        content = re.sub(r'</head>', f'    <script src="{sdk_rel_path}"></script>\n</head>', content, flags=re.IGNORECASE)
    elif 'arcadia-bridge.js' in content:
        content = content.replace('arcadia-bridge.js', 'durra-bridge.js')

    # 3. Rebranding
    content = content.replace('Arcadia', 'DURRA')
    content = content.replace('ARCADIA', 'DURRA')

    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    for root, dirs, files in os.walk(GAMES_DIR):
        if 'index.html' in files:
            enhance_game(os.path.join(root, 'index.html'))

if __name__ == "__main__":
    main()
