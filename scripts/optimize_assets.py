
import os
import re
import json

def optimize_game_assets(game_dir):
    print(f"Optimizing: {game_dir}")
    index_path = os.path.join(game_dir, 'index.html')
    if not os.path.exists(index_path):
        return

    with open(index_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Minify CSS (basic)
    def minify_css(match):
        css = match.group(1)
        css = re.sub(r'/\*.*?\*/', '', css, flags=re.DOTALL)
        css = re.sub(r'\s+', ' ', css)
        css = css.replace('{ ', '{').replace(' }', '}').replace('; ', ';').replace(': ', ':')
        return f'<style>{css.strip()}</style>'
    
    content = re.sub(r'<style>(.*?)</style>', minify_css, content, flags=re.DOTALL)

    # 2. Add resource hints
    hints = """
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="dns-prefetch" href="https://durra-games.com">
    """
    if '<link rel="preconnect"' not in content:
        content = content.replace('<head>', f'<head>\n{hints}')

    # 3. Optimize Images (Placeholder for real compression tool)
    # In a real environment, we'd use PIL or sharp to convert to WebP here.
    
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(content)

def run_optimization():
    base_dir = "public/games"
    for item in os.listdir(base_dir):
        item_path = os.path.join(base_dir, item)
        if os.path.isdir(item_path) and item != '_shared':
            # Check for versioned folders
            v1_path = os.path.join(item_path, 'v1')
            if os.path.exists(v1_path):
                optimize_game_assets(v1_path)
            else:
                optimize_game_assets(item_path)

if __name__ == "__main__":
    run_optimization()
    print("Optimization complete.")
