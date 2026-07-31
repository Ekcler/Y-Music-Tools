import zipfile
import os
import shutil

BASE = r'C:\Users\Ekcle\Downloads\opencode-windows-x64\Y-Music-Tools'
ZIP = os.path.join(BASE, 'Y-Music-Tools.zip')
TEMP = r'C:\temp\yb_build'

def clean(path):
    if os.path.exists(path):
        shutil.rmtree(path)
    os.makedirs(path, exist_ok=True)

def zip_dir(src_dir, zip_path, arc_prefix):
    zf = zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=9)
    for root, dirs, files in os.walk(src_dir):
        for f in files:
            full = os.path.join(root, f)
            arc = os.path.join(arc_prefix, os.path.relpath(full, src_dir)).replace('\\', '/')
            zf.write(full, arc)
    zf.close()

def build_firefox():
    print('[+] Building Firefox extension...')
    src = os.path.join(TEMP, 'firefox')
    clean(src)
    shutil.copy(os.path.join(BASE, 'manifest.json'), src)
    shutil.copytree(os.path.join(BASE, '_locales'), os.path.join(src, '_locales'), dirs_exist_ok=True)
    shutil.copytree(os.path.join(BASE, 'icon'), os.path.join(src, 'icon'), dirs_exist_ok=True, ignore=shutil.ignore_patterns('Image*.png'))
    shutil.copytree(os.path.join(BASE, 'script'), os.path.join(src, 'script'), dirs_exist_ok=True)
    zip_dir(src, ZIP, '')
    print('[+] Firefox: {} ({} bytes)'.format(ZIP, os.path.getsize(ZIP)))

def main():
    clean(TEMP)
    build_firefox()
    clean(TEMP)
    print('[+] Done.')

if __name__ == '__main__':
    main()
