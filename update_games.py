import os

root_dir = "/Users/dulorai/tiktokGame/public/games"

def update_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    if "LIFECYCLE_STOP" in content:
        print(f"Skipping {filepath} - already has STOP handler")
        return

    # Check available functions
    has_stop_game = "function stopGame()" in content
    has_pause_game = "function pauseGame()" in content

    handler_call = ""
    if has_stop_game:
        handler_call = "stopGame()"
    elif has_pause_game:
        handler_call = "pauseGame()"
    else:
        print(f"Skipping {filepath} - no stop/pause function found")
        return

    # Pattern to match
    # Usually: if (data.action === 'LIFECYCLE_RESUME') resumeGame();
    
    target_str = "if (data.action === 'LIFECYCLE_RESUME') resumeGame();"
    insertion = f"\n                    if (data.action === 'LIFECYCLE_STOP') {handler_call};"
    
    # Try different indentations if needed, but simple replace usually works if str matches
    # Using specific replacement to handle both window.addEventListener blocks if they exist
    
    new_content = content.replace(
        "if (data.action === 'LIFECYCLE_RESUME') resumeGame();",
        "if (data.action === 'LIFECYCLE_RESUME') resumeGame();" + insertion
    )
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath} using {handler_call}")
    else:
        print(f"Could not match pattern in {filepath}")

for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file == "index.html":
            update_file(os.path.join(root, file))
