import os
import re

dirs = ['c:/data/agentvoice/web2/frontend/src', 'c:/data/agentvoice/web2/02_meeting-insights-main/src']

def replace_atlas(content):
    # Specific phrases
    content = re.sub(r'\bAtlas Corp\b', 'ForSkale Corp', content)
    content = re.sub(r'\bAtlas Platform\b', 'ForSkale Platform', content)
    content = re.sub(r'\bAtlas Workflow\b', 'ForSkale Workflow', content)
    content = re.sub(r'\bAtlas Demo\b', 'ForSkale Demo', content)
    content = re.sub(r'\bAtlas Assistant\b', 'ForSkale Assistant', content)
    content = re.sub(r'\bAsk Atlas\b', 'Ask ForSkale', content)
    content = re.sub(r'\bWelcome to Atlas\b', 'Welcome to ForSkale', content)
    content = re.sub(r'\bContinue to Atlas\b', 'Continue to ForSkale', content)
    content = re.sub(r'\bChat with Atlas\b', 'Chat with ForSkale', content)
    content = re.sub(r'\bAtlas meeting context\b', 'ForSkale meeting context', content)
    content = re.sub(r'\bAtlas Insights\b', 'ForSkale Insights', content)
    content = re.sub(r'\bAtlas Dashboard\b', 'ForSkale Dashboard', content)
    content = re.sub(r'\bAtlas Playbook\b', 'ForSkale Playbook', content)
    content = re.sub(r'\bAtlas Calendar\b', 'ForSkale Calendar', content)
    content = re.sub(r'\bAtlas Q&A\b', 'ForSkale Q&A', content)
    
    # JSX text or quotes exact matches
    content = re.sub(r'>\s*Atlas\s*<', '>ForSkale<', content)
    content = re.sub(r"'Atlas'", "'ForSkale'", content)
    content = re.sub(r'"Atlas"', '"ForSkale"', content)
    content = re.sub(r'`Atlas`', '`ForSkale`', content)
    
    # Bounded Atlas occurrences
    content = re.sub(r'(?<= )Atlas(?= )', 'ForSkale', content)
    content = re.sub(r'(?<=\>)Atlas(?= )', 'ForSkale', content)
    content = re.sub(r'(?<= )Atlas(?=\<)', 'ForSkale', content)
    content = re.sub(r'(?<= )Atlas(?=[.,!?])', 'ForSkale', content)
    
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
