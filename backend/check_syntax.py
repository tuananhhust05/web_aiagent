#!/usr/bin/env python3
"""
Check syntax of deals files
"""

import ast
import sys
import os

def check_syntax(file_path):
    """Check Python syntax of a file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            source = f.read()
        
        # Parse the AST
        ast.parse(source)
        print(f"✅ {file_path} - Syntax OK")
        return True
        
    except SyntaxError as e:
        print(f"❌ {file_path} - Syntax Error: {e}")
        print(f"   Line {e.lineno}: {e.text}")
        return False
    except Exception as e:
        print(f"❌ {file_path} - Error: {e}")
        return False

def main():
    """Check syntax of all deals-related files"""
    print("🔍 Checking syntax of deals-related files...")
    
    files_to_check = [
        "app/models/deal.py",
        "app/routers/deals.py",
        "main.py"
    ]
    
    all_good = True
    
    for file_path in files_to_check:
        if os.path.exists(file_path):
            if not check_syntax(file_path):
                all_good = False
        else:
            print(f"❌ {file_path} - File not found")
            all_good = False
    
    if all_good:
        print("\n✅ All files have correct syntax!")
    else:
        print("\n❌ Some files have syntax errors!")
    
    return all_good

if __name__ == "__main__":
    main()










