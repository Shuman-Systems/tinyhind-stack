import json
import os
import sys
import threading
import http.server
import socketserver
import shutil
import functools
import subprocess
from urllib.request import urlopen, Request
from urllib.error import URLError

# --- Path Configuration ---
# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# The project root is one level up from the script's directory
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
FRONTEND_DIR = os.path.join(PROJECT_ROOT, 'frontend')

# --- Constants ---
CONFIG_FILE = os.path.join(SCRIPT_DIR, 'tinyconf.json') # Config lives with the script
PORT = 8776
SOURCE_DIR = os.path.join(FRONTEND_DIR, 'src')
SERVE_DIR = os.path.join(FRONTEND_DIR, 'serve')
ESBUILD_EXE = os.path.join(SCRIPT_DIR, 'esbuild.exe')

# ... (The rest of the script's functions remain the same, but now use these constants)

def build_project():
    """Compiles the TS project and builds a clean 'serve' directory."""
    print("Building project with esbuild...")
    
    if not os.path.exists(ESBUILD_EXE):
        print(f"\n--- BUILD FAILED ---\n'{ESBUILD_EXE}' not found in tools/ folder.\n")
        return

    os.makedirs(os.path.join(SERVE_DIR, 'js'), exist_ok=True)
    
    # Modify and copy index.html
    index_html_source = os.path.join(FRONTEND_DIR, 'index.html')
    if os.path.exists(index_html_source):
        with open(index_html_source, 'r') as f:
            html_content = f.read().replace('src="src/main.ts"', 'src="js/main.js"')
        with open(os.path.join(SERVE_DIR, 'index.html'), 'w') as f:
            f.write(html_content)
        print(f"  - Generated {os.path.join(SERVE_DIR, 'index.html')}")

    main_ts_file = os.path.join(SOURCE_DIR, 'main.ts')
    output_js = os.path.join(SERVE_DIR, 'js', 'main.js')
    
    command = f"{ESBUILD_EXE} {main_ts_file} --bundle --minify --outfile={output_js}"
    
    # We run the command from the frontend directory's context
    result = subprocess.run(command, shell=True, capture_output=True, text=True, encoding='utf-8', cwd=FRONTEND_DIR)
    
    if result.returncode == 0:
        print(f"  - Compiled JS to {output_js}")
        print("\nSUCCESS: Project built successfully.\n")
        if result.stderr:
            print(result.stderr)
    else:
        print("\n--- BUILD FAILED ---")
        print(result.stderr)

def start_server():
    """Serves the 'serve' directory."""
    if not os.path.exists(SERVE_DIR):
        print(f"Build output not found in '{SERVE_DIR}' directory. Build the project first.\n")
        return
    
    Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=SERVE_DIR)
    try:
        server = socketserver.TCPServer(("", PORT), Handler)
        print(f"--- Server starting on http://localhost:{PORT} ---")
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        
        
def clean_build():
    """Deletes the entire 'serve' directory."""
    if os.path.exists(SERVE_DIR):
        print(f"Deleting build output folder: {SERVE_DIR}")
        shutil.rmtree(SERVE_DIR)
        print("SUCCESS: Build folder cleaned.\n")
    else:
        print("Build folder not found. Nothing to clean.\n")

def print_menu():
    print("\n--- tinyhind.cli ---")
    print("1. Build for Development (Readable JS)")
    print("2. Build for Production (Minified JS)")
    print("3. Pull Latest Schema")
    print("4. Start Dev Server")
    print("5. Clean Build Folder")
    print("6. Quit")
    print("--------------------")

def main():
    """Main function to run the interactive menu."""
    config = load_config()
    while True:
        print_menu()
        choice = input("> ")
        
        if choice == '1':
            build_project(minify=False)
        elif choice == '2':
            build_project(minify=True)
        elif choice == '3':
            pull_schema(config)
        elif choice == '4':
            start_server()
        elif choice == '5':
            clean_build()
        elif choice == '6':
            print("Exiting.")
            sys.exit(0)
        else:
            print("Invalid choice, please try again.")

if __name__ == '__main__':
    main()