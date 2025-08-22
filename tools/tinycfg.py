import json
import os
import sys
import uuid
import threading
import http.server
import socketserver
import shutil
import functools
import subprocess
from urllib.request import urlopen, Request
from urllib.error import URLError
import time

# --- Path Configuration ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
FRONTEND_DIR = os.path.join(PROJECT_ROOT, 'frontend')
BACKEND_DIR = os.path.join(PROJECT_ROOT, 'backend')
PAGES_DIR = os.path.join(FRONTEND_DIR, 'pages') # <-- ADD THIS

# --- Constants ---
CONFIG_FILE = os.path.join(SCRIPT_DIR, 'tinyconf.json')
PORT = 8776
# SOURCE_DIR is no longer needed
TINYLIB_DIR = os.path.join(FRONTEND_DIR, 'tinylib')
SERVE_DIR = os.path.join(PROJECT_ROOT, 'serve') # Build output for separate mode
WWW_ROOT_DIR = os.path.join(BACKEND_DIR, 'wwwroot') # Build output for unified mode
ESBUILD_EXE = os.path.join(SCRIPT_DIR, 'esbuild.exe')
TAILWIND_EXE = os.path.join(SCRIPT_DIR, 'tailwind.exe') 
VERSION = 'v0.1.0'

# --- Colors for CLI Output ---
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

# --- CLI Functions ---
def print_header():
    """Prints the CLI header and information."""
    # ASCII Art - using a raw string to handle backslashes
    art = r"""
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⡿⢦⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡏⢀⠉⠳⠦⣤⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣇⣂⣌⣐⢀⠂⡙⠳⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⣀⣤⠿⡛⣛⠛⡟⠻⢿⣿⣤⡠⠸⣧⠀⠀⠀⠀⠀⢀⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⢀⣤⠞⠭⢊⡒⡱⢨⠱⢌⢓⠢⣗⢎⠿⣷⣼⣆⣠⡴⠞⠛⡉⢉⠉⡉⠛⠛⠶⣤⣀⠀⠀
⠀⠀⠀⣠⡞⠁⠀⣌⠱⢌⡡⢃⠞⡨⢌⣳⢍⣮⣷⡾⠟⡟⢻⠛⠿⣳⢶⣤⣆⡄⠡⠈⠄⠠⢉⣷⠂
⠀⠀⣰⢯⠀⡄⢪⢄⢫⠰⡡⢍⡒⡱⣬⣷⢟⠫⣁⠖⡩⢌⡑⢎⡱⢂⢯⡜⣹⢻⣶⣅⢨⣰⠞⠁⠀
⠀⢰⣏⢆⠣⠜⣡⢊⡔⠣⠜⢢⢼⣼⡟⠒⢎⡱⢌⢒⡱⠌⡜⢂⠖⡩⡘⣮⢱⢣⠞⡽⣿⠁⠀⠀⠀
⠀⣿⡘⠤⢋⡜⡐⠦⢌⢣⡙⣼⠿⠊⠀⡜⡐⢆⠎⡒⢤⠋⡴⢉⠲⢡⡑⣏⢎⢧⡛⡴⣛⣷⠀⠀⠀
⢀⡇⠣⢍⠲⡐⡍⣒⡉⠦⣼⠯⠃⢀⢊⠴⣉⠲⢌⡱⢊⡜⢰⠩⣘⢡⠒⣏⠞⣦⡙⢶⡡⢿⡆⠀⠀
⠈⡇⢃⢎⡱⢘⡰⠡⡜⣱⡟⡡⢔⡡⢎⠒⣌⠲⢡⠒⡥⡘⢆⠓⡌⠦⣹⢭⡚⡴⣙⠦⣝⢺⡧⠀⠀
⠀⣿⡌⡒⢬⢡⢒⡱⠌⣿⡅⠳⡨⢔⢊⡱⢂⡍⠦⢩⠔⣑⢊⡱⢌⡑⣏⠶⣙⠶⣩⠞⣬⢻⡇⠀⠀
⠀⢸⣧⢉⠖⠢⣅⠲⡉⢆⡜⣡⢑⡊⠦⣑⢊⠴⣉⠲⡘⠤⣃⠲⢌⡼⢎⡳⣍⠞⣥⢛⡴⣹⠃⠀⠀
⠀⠀⢻⡎⡜⡡⢆⢣⢉⢆⠲⢄⠣⠜⡡⢆⡩⢒⢌⡱⢌⢃⠦⣉⡶⣙⢮⡱⢎⡝⢦⣋⢶⡏⠀⠀⠀
⠀⠀⠀⢻⣖⡡⢎⠢⢍⠢⡍⡜⢌⢣⡑⠦⣑⠪⠔⡒⡌⢎⡴⣋⠶⣩⢖⡹⢎⡜⣣⢾⡟⠀⠀⠀⠀
⠀⠀⠀⠀⠹⣶⡡⠍⡆⡓⠴⡘⡌⠦⣘⠒⡤⢋⡜⣡⡜⢮⠳⣍⢞⡱⢎⡵⢫⣜⣵⠋⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠘⢿⣞⡴⢭⣒⣡⢎⡑⢦⡍⣖⢣⡝⢦⣙⢎⡳⡜⢮⡱⢫⣼⡵⠟⠁⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠙⢷⣇⡞⡴⢫⡜⣣⠞⣬⠳⣜⢣⠞⣬⣓⣝⣦⡿⠛⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢷⣭⣷⣼⣥⣿⣶⠿⠾⠟⠛⠛⠋⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀       
"""
    art_lines = art.strip().split('\n')
    
    info_lines = [
        "",
        "",
        "",
        """ _   _             _     _           _     """,
        """| | (_)           | |   (_)         | |    """,
        """| |_ _ _ __  _   _| |__  _ _ __   __| |    """,
        """| __| | '_ \\| | | | '_ \\| | '_ \\ / _` | """,
        """| |_| | | | | |_| | | | | | | | | (_| |    """,
       f""" \\__|_|_| |_|\\__, |_| |_|_|_| |_|\\__,_| {Colors.OKBLUE}Stack {VERSION}{Colors.ENDC} """,
       f"""{Colors.OKBLUE}============={Colors.ENDC} __/ |{Colors.OKBLUE}==========================={Colors.ENDC}    """,
        """             |___/                         """,
        "",
        f"{Colors.OKBLUE}Hind: Minimal .Net8 Api + SQLite{Colors.ENDC}",
        f"{Colors.OKBLUE}Fore: Typescript + autoschema/types{Colors.ENDC}",
        f"{Colors.OKBLUE}      Ultra Light, Anti-Node/Deno.{Colors.ENDC}",
        "",
        "Danie Schoeman, Shuman Systems",
        "https://github.com/Shuman-Systems/tinyhind-stack",
        f"{Colors.WARNING}TinyHind, when static is ALMOST enough....{Colors.ENDC}",
    ]
    
    max_art_width = 0
    for line in art_lines:
        if len(line) > max_art_width:
            max_art_width = len(line)

    num_lines = max(len(art_lines), len(info_lines))

    for i in range(num_lines):
        art_line = art_lines[i] if i < len(art_lines) else ""
        info_line = info_lines[i] if i < len(info_lines) else ""
        
        padded_art_line = art_line.ljust(max_art_width)
        
        # Changed Colors.WARNING to Colors.FAIL for the red color
        print(f"{Colors.FAIL}{padded_art_line}{Colors.ENDC}  {info_line}")
    print()

def load_config():
    """Loads config, ensuring all necessary keys exist."""
    config = {}
    save_needed = False
    if not os.path.exists(CONFIG_FILE):
        backend_url = input("Please enter the base URL for the backend (e.g., http://localhost:5087): ")
        config = {
            'backend_url': backend_url,
            'hosting_mode': 'separate',
            'tenant_id': str(uuid.uuid4()) # Generate new ID
        }
        save_needed = True
    else:
        with open(CONFIG_FILE, 'r') as f:
            config = json.load(f)
        if 'hosting_mode' not in config:
            config['hosting_mode'] = 'separate'
            save_needed = True
        if 'tenant_id' not in config:
            print("Generating new tenant ID...")
            config['tenant_id'] = str(uuid.uuid4()) # Generate new ID if missing
            save_needed = True
            
    if save_needed:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)
        print(f"Configuration updated in {CONFIG_FILE}\n")
    return config

def save_config(config):
    """Saves the configuration object to the file."""
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=2)

def pull_schema(config):
    """Fetches the TypeScript definitions from the backend."""
    output_file = os.path.join(TINYLIB_DIR, 'api-types.ts')
    tenant_id = config.get('tenant_id') # Read from config
    url = f"{config['backend_url']}/rune/{tenant_id}/definitions.ts"
    print(f"Pulling schema for tenant {tenant_id}...")
    try:
        req = Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urlopen(req) as response: content = response.read().decode('utf-8')
        os.makedirs(TINYLIB_DIR, exist_ok=True)
        with open(output_file, 'w') as f: f.write(content)
        print(f"{Colors.OKGREEN}SUCCESS:{Colors.ENDC} Schema saved to {output_file}\n")
    except Exception as e:
        print(f"{Colors.FAIL}\n--- ERROR --- \nCould not connect to backend. Is it running?\n{e}\n{Colors.ENDC}")


def build_project(config, minify=False):
    """Compiles CSS with Tailwind and TS with esbuild."""
    hosting_mode = config.get('hosting_mode', 'separate')
    output_dir = WWW_ROOT_DIR if hosting_mode == 'unified' else SERVE_DIR
    build_mode = "Production (minified)" if minify else "Development (readable)"
    print(f"Building project for {build_mode} into '{output_dir}'...")
    build_id = str(int(time.time())) # <-- ADD THIS LINE

    # --- Pre-flight checks for executables and source files ---
    if not os.path.exists(ESBUILD_EXE) or not os.path.exists(TAILWIND_EXE):
        print(f"{Colors.FAIL}\n--- BUILD FAILED ---\n'esbuild.exe' or 'tailwind.exe' not found in tools/ folder.\n{Colors.ENDC}")
        return
    source_css_path = os.path.join(FRONTEND_DIR, 'input.css')
    if not os.path.exists(source_css_path):
        print(f"{Colors.FAIL}\n--- BUILD FAILED ---\nSource CSS not found at '{source_css_path}'.\n{Colors.ENDC}")
        return

    # --- Step 1: Run Tailwind CSS build ---
    print("  - Building CSS with Tailwind...")
    output_css_dir = os.path.join(output_dir, 'css')
    os.makedirs(output_css_dir, exist_ok=True)
    output_css_path = os.path.join(output_css_dir, 'main.css')
    tailwind_config_path = os.path.join(PROJECT_ROOT, 'tailwind.config.js')
    
    tailwind_command = [
        TAILWIND_EXE,
        '-c', tailwind_config_path,
        '-i', source_css_path,
        '-o', output_css_path,
        '--verbose'
    ]
    if minify:
        tailwind_command.append('--minify')


    # ... inside build_project ...
    tailwind_result = subprocess.run(tailwind_command, shell=True, capture_output=True, text=True, encoding='utf-8', cwd=PROJECT_ROOT)
    if tailwind_result.returncode != 0:
        print(f"{Colors.FAIL}\n--- TAILWIND BUILD FAILED ---\n{Colors.ENDC}")
        print(f"{Colors.FAIL}{tailwind_result.stderr}{Colors.ENDC}")
        return
    print(f"  - CSS generated at '{output_css_path}'")

    # --- Step 2: Generate config.ts for TypeScript ---
    base_url = "" if hosting_mode == 'unified' else config.get('backend_url', '')
    tenant_id = config.get('tenant_id')
    config_ts_path = os.path.join(FRONTEND_DIR, 'config.ts')
    print(f"  - Generating config.ts for '{hosting_mode}' mode...")
    with open(config_ts_path, 'w') as f:
        f.write(f"export const API_BASE_URL = '{base_url}';\n")
        f.write(f"export const TENANT_ID = '{tenant_id}';\n")

    # --- Step 3: Discover TypeScript entry points and copy HTML ---
    entry_points = []
    # (The rest of this function remains unchanged from the previous version)
    print("  - Scanning for pages and copying HTML...")
    for root, _, files in os.walk(PAGES_DIR):
        for file in files:
            if file.endswith('.html'):
                html_path = os.path.join(root, file)
                ts_equivalent = html_path.replace('.html', '.ts')
                output_html_path = os.path.join(output_dir, os.path.relpath(html_path, PAGES_DIR))
                os.makedirs(os.path.dirname(output_html_path), exist_ok=True)
                with open(html_path, 'r') as f_in:
                    html_content = f_in.read()
                    
                    css_link_tag = f'    <link rel="stylesheet" href="/css/main.css?v={build_id}">\n'
                    html_content = html_content.replace('</head>', f'{css_link_tag}</head>')
                if os.path.exists(ts_equivalent):
                    entry_points.append(ts_equivalent)
                    ts_filename = os.path.basename(ts_equivalent)
                    js_filename = ts_filename.replace('.ts', '.js')
                    html_content = html_content.replace(
                        f'src="{ts_filename}"',
                        f'src="{js_filename}?v={build_id}"'
                    ).replace(
                        f'src="./{ts_filename}"',
                        f'src="{js_filename}?v={build_id}"'
                    )
                with open(output_html_path, 'w') as f_out:
                    f_out.write(html_content)
    if not entry_points:
        print(f"{Colors.WARNING}No TypeScript entry points found to build.{Colors.ENDC}")
        print(f"{Colors.OKGREEN}\nSUCCESS: HTML files copied and CSS built.\n{Colors.ENDC}")
        return

    # --- Step 4: Run esbuild with all entry points ---
    print(f"  - Compiling {len(entry_points)} TypeScript entry points with code splitting...")
    command = [ESBUILD_EXE] + entry_points + [
        f"--outdir={output_dir}",
        "--bundle",
        "--splitting",
        "--format=esm",
        '--chunk-names=js/[name]-[hash]'
    ]
    if minify:
        command.append("--minify")
    result = subprocess.run(command, shell=True, capture_output=True, text=True, encoding='utf-8', cwd=FRONTEND_DIR)
    if result.returncode == 0:
        print(f"{Colors.OKGREEN}\nSUCCESS: Project built successfully ({build_mode}).\n{Colors.ENDC}")
        if result.stderr:
            print(result.stderr)
    else:
        print(f"{Colors.FAIL}\n--- ESBUILD FAILED ---\n{Colors.ENDC}")
        print(f"{Colors.FAIL}{result.stderr}{Colors.ENDC}")
            
            
        
def start_frontend_server():
    """Serves the 'serve' directory."""
    if not os.path.exists(SERVE_DIR):
        print(f"{Colors.FAIL}Build output not found in '{SERVE_DIR}' directory. Please build the project first.\n{Colors.ENDC}")
        return
    Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=SERVE_DIR)
    try:
        server = socketserver.TCPServer(("", PORT), Handler)
        print(f"{Colors.OKBLUE}--- Frontend server starting on http://localhost:{PORT} ---{Colors.ENDC}")
        server.serve_forever()
    except OSError:
        print(f"{Colors.FAIL}\n--- ERROR: Port {PORT} is already in use. ---\n{Colors.ENDC}")
    except KeyboardInterrupt:
        print("\nServer stopped.")

def start_backend_server(config):
    """Cleans and starts the .NET backend, respecting the hosting mode."""
    hosting_mode = config.get('hosting_mode', 'separate')
    print(f"Attempting to start .NET backend in '{hosting_mode}' mode...")
    
    env = os.environ.copy()
    env['TINYHIND_HOSTING_MODE'] = hosting_mode.capitalize()

    try:
        # --- THIS IS THE NEW PART ---
        # 1. Clean the backend project first to remove stale build files.
        print("  - Running 'dotnet clean' on the backend project...")
        clean_result = subprocess.run(['dotnet', 'clean'], cwd=BACKEND_DIR, capture_output=True, text=True, encoding='utf-8')
        if clean_result.returncode != 0:
            print(f"{Colors.FAIL}\n--- 'dotnet clean' FAILED ---")
            print(clean_result.stderr, Colors.ENDC)
            return
        # --- END OF NEW PART ---

        # 2. Launch the backend server.
        if hosting_mode == 'unified':
            print(f"{Colors.OKGREEN}Starting Unified Server in this terminal. Press Ctrl+C to stop.{Colors.ENDC}")
            subprocess.run(['dotnet', 'watch', 'run'], cwd=BACKEND_DIR, env=env)
        else:  # separate mode
            if sys.platform == "win32":
                command = f'start cmd /k "cd {BACKEND_DIR} && dotnet watch run"'
                subprocess.Popen(command, shell=True, env=env)
            else:
                print(f"{Colors.WARNING}Auto-launching new terminal is not fully supported on this OS.{Colors.ENDC}")
                print(f"Please run 'dotnet watch run' in the '{BACKEND_DIR}' folder manually.")
            print(f"{Colors.OKGREEN}SUCCESS: Backend process launched in new window.\n{Colors.ENDC}")
    except Exception as e:
        print(f"{Colors.FAIL}\n--- ERROR --- \nFailed to launch backend process.\n{e}\n{Colors.ENDC}")
        
        
def clean_build():
    """Deletes all build output folders."""
    cleaned = False
    if os.path.exists(SERVE_DIR):
        print(f"Deleting build output folder: {SERVE_DIR}")
        shutil.rmtree(SERVE_DIR)
        cleaned = True
    if os.path.exists(WWW_ROOT_DIR):
        print(f"Deleting build output folder: {WWW_ROOT_DIR}")
        shutil.rmtree(WWW_ROOT_DIR)
        cleaned = True
    if cleaned:
        print(f"{Colors.OKGREEN}SUCCESS: Build folders cleaned.\n{Colors.ENDC}")
    else:
        print("Build folders not found. Nothing to clean.\n")

def switch_to_unified(config):
    """Moves frontend build to backend wwwroot and updates config."""
    if not os.path.exists(SERVE_DIR):
        print(f"{Colors.WARNING}Build output not found in '{SERVE_DIR}'. Please build the project first.\n{Colors.ENDC}")
        return
    if os.path.exists(WWW_ROOT_DIR):
        print(f"Removing existing '{WWW_ROOT_DIR}' to ensure a clean move...")
        shutil.rmtree(WWW_ROOT_DIR)
    
    print(f"Moving '{SERVE_DIR}' to '{WWW_ROOT_DIR}'...")
    shutil.move(SERVE_DIR, WWW_ROOT_DIR)
    
    config['hosting_mode'] = 'unified'
    save_config(config)
    print(f"{Colors.OKGREEN}SUCCESS: Switched to Unified mode. Files have been moved.\n{Colors.ENDC}")

def switch_to_separate(config):
    """Moves frontend build from wwwroot back to frontend/serve and updates config."""
    if not os.path.exists(WWW_ROOT_DIR):
        print(f"{Colors.WARNING}No unified build found in '{WWW_ROOT_DIR}'. Nothing to do.\n{Colors.ENDC}")
        return
    if os.path.exists(SERVE_DIR):
        print(f"Removing existing '{SERVE_DIR}' to ensure a clean move...")
        shutil.rmtree(SERVE_DIR)
        
    print(f"Moving '{WWW_ROOT_DIR}' to '{SERVE_DIR}'...")
    shutil.move(WWW_ROOT_DIR, SERVE_DIR)
    
    config['hosting_mode'] = 'separate'
    save_config(config)
    print(f"{Colors.OKGREEN}SUCCESS: Switched to Separate mode. Files have been moved.\n{Colors.ENDC}")

def main_menu(config):
    """Displays the main menu and handles user input."""
    try:
        while True:
            # Load config inside the loop to refresh the 'mode' display after a switch
            config = load_config()
            current_mode = config.get('hosting_mode', 'separate')
            mode_text = current_mode.capitalize()
            mode_color = Colors.OKGREEN if current_mode == 'unified' else Colors.OKBLUE

            print(f"\n{Colors.HEADER}--- tinyhind.cli (Mode: {mode_text}) ---{Colors.ENDC}")
            print("--- Build ---")
            print("1. Build for Development")
            print("2. Build for Production (Minified)")
            print("3. Nuke Build Folders")
            print("--- Config & Schema ---")
            print("4. Pull Latest Schema")
            if current_mode == 'separate':
                print(f"5. {mode_color}Switch to Unified Mode{Colors.ENDC}")
            else:
                print(f"5. {mode_color}Switch to Separate Mode{Colors.ENDC}")
            print("--- Serve Project ---")
            print("6. Start Frontend-Only Server")
            if current_mode == 'separate':
                print(f"7. {mode_color}Start Backend-Only Server{Colors.ENDC}")
            else: # unified
                print(f"7. {mode_color}Start Unified Server{Colors.ENDC}")
            print("--------------------")
            print("8. Quit")
            choice = input("> ")

            if choice == '1': build_project(config, minify=False)
            elif choice == '2': build_project(config, minify=True)
            elif choice == '3': clean_build()
            elif choice == '4': pull_schema(config)
            elif choice == '5':
                if current_mode == 'separate':
                    switch_to_unified(config)
                else:
                    switch_to_separate(config)
            elif choice == '6': start_frontend_server()
            elif choice == '7': start_backend_server(config)
            elif choice == '8':
                print("Exiting.")
                sys.exit(0)
            else:
                print(f"{Colors.FAIL}Invalid choice, please try again.{Colors.ENDC}")
    except KeyboardInterrupt:
        print("\nExiting.")
        sys.exit(0)



if __name__ == '__main__':
    config = load_config()
    print_header()
    main_menu(config)
