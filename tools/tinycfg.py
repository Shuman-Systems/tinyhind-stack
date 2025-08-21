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
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
FRONTEND_DIR = os.path.join(PROJECT_ROOT, 'frontend')
BACKEND_DIR = os.path.join(PROJECT_ROOT, 'backend')

# --- Constants ---
CONFIG_FILE = os.path.join(SCRIPT_DIR, 'tinyconf.json')
PORT = 8776
SOURCE_DIR = os.path.join(FRONTEND_DIR, 'src')
TINYLIB_DIR = os.path.join(FRONTEND_DIR, 'tinylib')
SERVE_DIR = os.path.join(FRONTEND_DIR, 'serve') # Build output for separate mode
WWW_ROOT_DIR = os.path.join(BACKEND_DIR, 'wwwroot') # Build output for unified mode
ESBUILD_EXE = os.path.join(SCRIPT_DIR, 'esbuild.exe')
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
    """Loads config, ensuring 'hosting_mode' exists, defaulting to 'separate'."""
    config = {}
    if not os.path.exists(CONFIG_FILE):
        backend_url = input("Please enter the base URL for the backend (e.g., http://localhost:5087): ")
        config = {'backend_url': backend_url, 'hosting_mode': 'separate'}
    else:
        with open(CONFIG_FILE, 'r') as f:
            config = json.load(f)
        if 'hosting_mode' not in config:
            config['hosting_mode'] = 'separate'
            
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=2)
    return config

def save_config(config):
    """Saves the configuration object to the file."""
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=2)

def pull_schema(config):
    """Fetches the TypeScript definitions from the backend."""
    output_file = os.path.join(TINYLIB_DIR, 'api-types.ts')
    tenant_id = 'd95cc89b-e287-47d0-996a-508df06d520f'
    url = f"{config['backend_url']}/rune/{tenant_id}/definitions.ts"
    print(f"Pulling schema to {output_file}...")
    try:
        req = Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urlopen(req) as response: content = response.read().decode('utf-8')
        os.makedirs(TINYLIB_DIR, exist_ok=True)
        with open(output_file, 'w') as f: f.write(content)
        print(f"{Colors.OKGREEN}SUCCESS:{Colors.ENDC} Schema saved to {output_file}\n")
    except Exception as e:
        print(f"{Colors.FAIL}\n--- ERROR --- \nCould not connect to backend. Is it running?\n{e}\n{Colors.ENDC}")

def build_project(config, minify=False):
    """Compiles the TS project into the correct directory based on hosting mode."""
    hosting_mode = config.get('hosting_mode', 'separate')
    output_dir = WWW_ROOT_DIR if hosting_mode == 'unified' else SERVE_DIR
    
    build_mode = "Production (minified)" if minify else "Development (readable)"
    print(f"Building project for {build_mode} into '{output_dir}'...")
    
    if not os.path.exists(ESBUILD_EXE):
        print(f"{Colors.FAIL}\n--- BUILD FAILED ---\n'{os.path.basename(ESBUILD_EXE)}' not found in tools/ folder.\n{Colors.ENDC}")
        return
        
    os.makedirs(os.path.join(output_dir, 'js'), exist_ok=True)
    try:
        index_html_source = os.path.join(FRONTEND_DIR, 'index.html')
        with open(index_html_source, 'r') as f: html_content = f.read()
        html_content = html_content.replace('src="dist/main.js"', 'src="js/main.js"').replace('src="src/main.ts"', 'src="js/main.js"')
        with open(os.path.join(output_dir, 'index.html'), 'w') as f: f.write(html_content)
        print(f"  - Generated {os.path.join(output_dir, 'index.html')}")
    except FileNotFoundError:
        print(f"{Colors.WARNING}\n--- WARNING: 'index.html' not found in project root. ---\n{Colors.ENDC}")
        
    main_ts_file = os.path.join(SOURCE_DIR, 'main.ts')
    output_js = os.path.join(output_dir, 'js', 'main.js')
    command = f"{ESBUILD_EXE} {main_ts_file} --bundle --outfile={output_js}"
    if minify: command += " --minify"
    result = subprocess.run(command, shell=True, capture_output=True, text=True, encoding='utf-8', cwd=FRONTEND_DIR)
    
    if result.returncode == 0:
        print(f"  - Compiled JS to {output_js}")
        print(f"{Colors.OKGREEN}\nSUCCESS: Project built successfully ({build_mode}).\n{Colors.ENDC}")
        if result.stderr: print(result.stderr)
    else:
        print(f"{Colors.FAIL}\n--- BUILD FAILED ---"); print(result.stderr, Colors.ENDC)

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
    """Starts the .NET backend, setting the hosting mode via environment variable."""
    hosting_mode = config.get('hosting_mode', 'separate')
    print(f"Attempting to start .NET backend in '{hosting_mode}' mode...")
    try:
        if sys.platform == "win32":
            env_command = f"set TINYHIND_HOSTING_MODE={hosting_mode.capitalize()} &&"
            command = f'start cmd /k "{env_command} cd {BACKEND_DIR} && dotnet run"'
            subprocess.Popen(command, shell=True)
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
    """Updates config to Unified mode."""
    config['hosting_mode'] = 'unified'
    save_config(config)
    print(f"{Colors.OKGREEN}SUCCESS: Switched to Unified mode.{Colors.ENDC}")
    print(f"{Colors.WARNING}Please rebuild your project for the changes to take effect.{Colors.ENDC}\n")

def switch_to_separate(config):
    """Updates config to Separate mode."""
    config['hosting_mode'] = 'separate'
    save_config(config)
    print(f"{Colors.OKGREEN}SUCCESS: Switched to Separate mode.{Colors.ENDC}")
    print(f"{Colors.WARNING}Please rebuild your project for the changes to take effect.{Colors.ENDC}\n")

def main_menu(config):
    """Displays the main menu and handles user input."""
    try:
        while True:
            current_mode = config.get('hosting_mode', 'separate').capitalize()
            print(f"\n{Colors.HEADER}--- tinyhind.cli (Mode: {current_mode}) ---{Colors.ENDC}")
            print("1. Build & Run")
            print("2. Configuration")
            print("3. Quit")
            print("--------------------")
            choice = input("> ")
            if choice == '1':
                build_run_submenu(config)
            elif choice == '2':
                config_submenu(config)
            elif choice == '3':
                print("Exiting.")
                sys.exit(0)
            else:
                print(f"{Colors.FAIL}Invalid choice, please try again.{Colors.ENDC}")
    except KeyboardInterrupt:
        print("\nExiting.")
        sys.exit(0)

def build_run_submenu(config):
    """Displays the Build & Run submenu."""
    while True:
        print("\n--- Build & Run ---")
        print("1. Build for Development")
        print("2. Build for Production (Minified)")
        print("3. Start Frontend Server (Separate Mode)")
        print("4. Start Backend Server")
        print("5. Back to Main Menu")
        print("-------------------")
        choice = input("> ")
        if choice == '1': build_project(config, minify=False)
        elif choice == '2': build_project(config, minify=True)
        elif choice == '3': start_frontend_server()
        elif choice == '4': start_backend_server(config)
        elif choice == '5': return
        else: print(f"{Colors.FAIL}Invalid choice.{Colors.ENDC}")

def config_submenu(config):
    """Displays the Configuration submenu."""
    while True:
        current_mode = config.get('hosting_mode', 'separate')
        print("\n--- Configuration ---")
        print("1. Pull Latest Schema")
        if current_mode == 'separate':
            print(f"2. {Colors.OKGREEN}Switch to Unified Mode{Colors.ENDC}")
        else:
            print(f"2. {Colors.OKBLUE}Switch to Separate Mode{Colors.ENDC}")
        print("3. Clean Build Folders")
        print("4. Back to Main Menu")
        print("---------------------")
        choice = input("> ")
        if choice == '1': pull_schema(config)
        elif choice == '2':
            if current_mode == 'separate':
                switch_to_unified(config)
            else:
                switch_to_separate(config)
            return
        elif choice == '3': clean_build()
        elif choice == '4': return
        else: print(f"{Colors.FAIL}Invalid choice.{Colors.ENDC}")

if __name__ == '__main__':
    config = load_config()
    print_header() # Print the header once at the start
    main_menu(config)
