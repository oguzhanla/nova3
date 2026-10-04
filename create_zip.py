import os
import zipfile

def create_project_zip():
    cwd = os.getcwd()
    output_zip = os.path.join(cwd, 'novastream-tv.zip')
    
    exclude_dirs = {'node_modules', '.git', '.cache', 'dist', '__pycache__', '.next'}
    exclude_files = {'novastream-tv.zip', 'bun.lock', '.DS_Store', 'create_zip.py'}
    
    print(f"Creating zip file at: {output_zip}")
    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(cwd):
            dirs[:] = [d for d in dirs if d not in exclude_dirs and (not d.startswith('.') or d == '.github' or d == 'workflows')]
            for file in files:
                if file in exclude_files or file.endswith('.pyc'):
                    continue
                # Do not exclude essential dotfiles and workflow files
                if file.startswith('.') and file not in ['.env.example', '.gitignore'] and not root.startswith(os.path.join(cwd, '.github')):
                    continue
                    
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, cwd)
                zipf.write(full_path, rel_path)

    size = os.path.getsize(output_zip)
    print(f"Zip created successfully! Total size: {size} bytes ({size / 1024:.1f} KB)")

if __name__ == '__main__':
    create_project_zip()
