import os
import subprocess

SCRIPT_FOLDERS = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), '../../stealth')),
    os.path.abspath(os.path.join(os.path.dirname(__file__), '../../core')),
    # Add more folders if needed
]

def list_scripts():
    found = []
    for folder in SCRIPT_FOLDERS:
        if os.path.exists(folder):
            found += [
                os.path.join(os.path.basename(folder), f)
                for f in os.listdir(folder)
                if f.endswith('.py') and not f.startswith('__')
            ]
    return found

def run_script(script_path):
    # script_path example: 'stealth/my_script.py'
    abs_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../', script_path))
    if not os.path.exists(abs_path):
        return False, f'Script not found: {abs_path}'
    try:
        result = subprocess.run(
            ['python', abs_path],
            capture_output=True, text=True, timeout=120
        )
        return result.returncode == 0, result.stdout or result.stderr
    except Exception as e:
        return False, str(e)
