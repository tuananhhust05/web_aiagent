import os
import re

dirs = ['c:/data/agentvoice/web2/action-ready-main/src']

def replace_atlas(content):
    # Additional specific phrases
    content = re.sub(r'\bPrepared by Atlas\b', 'Prepared by ForSkale', content)
    content = re.sub(r'\bAtlas&apos;s\b', 'ForSkale&apos;s', content)
    content = re.sub(r'\bresponse from Atlas\b', 'response from ForSkale', content)
    content = re.sub(r'\bAtlas Intelligence\b', 'ForSkale Intelligence', content)
    content = re.sub(r'\bAtlas introduction tour\b', 'ForSkale introduction tour', content)
    content = re.sub(r'\bAtlas is your sales coach\b', 'ForSkale is your sales coach', content)
    content = re.sub(r'\bRAG Atlas\b', 'RAG ForSkale', content)
    content = re.sub(r'\bto Atlas\b', 'to ForSkale', content)
    content = re.sub(r'\bfor Atlas\b', 'for ForSkale', content)
    content = re.sub(r'\[Atlas\]', '[ForSkale]', content)
    content = re.sub(r'\bAtlas\b(?=\s+Intelligence)', 'ForSkale', content)
    content = re.sub(r'\bAtlas\b(?=\s+is\s+your)', 'ForSkale', content)
    
    return content

changed_files = []
for d in dirs:
    if not os.path.exists(d):
        continue
    for root, _, files in os.walk(d):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                new_content = replace_atlas(content)
                if new_content != content:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    changed_files.append(path)

print('Changed files:')
for cf in changed_files:
    print(cf)
