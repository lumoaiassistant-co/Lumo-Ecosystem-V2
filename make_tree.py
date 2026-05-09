import os

def list_files(startpath):
    with open("my_tree.txt", "w", encoding="utf-8") as f:
        for root, dirs, files in os.walk(startpath):
            # تجاهل الفولدرات اللي بتزحم الدنيا على الفاضي
            dirs[:] = [d for d in dirs if d not in ['.git', '__pycache__', '.venv', 'node_modules', '.ipynb_checkpoints']]
            
            level = root.replace(startpath, '').count(os.sep)
            indent = ' ' * 4 * (level)
            f.write(f'{indent}{os.path.basename(root)}/\n')
            subindent = ' ' * 4 * (level + 1)
            for file in files:
                f.write(f'{subindent}{file}\n')

list_files('.')
print("تم إنشاء ملف my_tree.txt بنجاح!")