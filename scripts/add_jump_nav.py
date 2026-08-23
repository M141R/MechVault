import re

def add_jump_nav(html_path):
    with open(html_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the cheat sheet section and add jump nav after the manometer tracing / first subsection
    jump_nav = '''        </div>
        <nav class="cheat-jump" style="margin:24px 0;padding:16px;background:var(--card,#fff);border:1px solid var(--border,#e2e8f0);border-radius:12px">
          <strong style="font-size:0.9rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted)">Jump to module:</strong>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">
            <a href="#cheat-m1" class="jump-link" style="padding:6px 12px;background:var(--accent,#2563eb);color:#fff;border-radius:6px;font-size:0.85rem;text-decoration:none">M1</a>
            <a href="#cheat-m2" class="jump-link" style="padding:6px 12px;background:var(--accent,#2563eb);color:#fff;border-radius:6px;font-size:0.85rem;text-decoration:none">M2</a>
            <a href="#cheat-m3" class="jump-link" style="padding:6px 12px;background:var(--accent,#2563eb);color:#fff;border-radius:6px;font-size:0.85rem;text-decoration:none">M3</a>
            <a href="#cheat-m4" class="jump-link" style="padding:6px 12px;background:var(--accent,#2563eb);color:#fff;border-radius:6px;font-size:0.85rem;text-decoration:none">M4</a>
            <a href="#cheat-m5" class="jump-link" style="padding:6px 12px;background:var(--accent,#2563eb);color:#fff;border-radius:6px;font-size:0.85rem;text-decoration:none">M5</a>
          </div>
        </nav>'''
    
    # Add IDs to the details summaries for each module
    # Pattern: <details open>\n            <summary><strong>M1
    content = re.sub(r'(<details open>\s*<summary><strong>M1)', r'<details id="cheat-m1" open>\n            <summary><strong>M1', content)
    content = re.sub(r'(<details open>\s*<summary><strong>M2)', r'<details id="cheat-m2" open>\n            <summary><strong>M2', content)
    content = re.sub(r'(<details open>\s*<summary><strong>M3)', r'<details id="cheat-m3" open>\n            <summary><strong>M3', content)
    content = re.sub(r'(<details>\s*<summary><strong>M4)', r'<details id="cheat-m4">\n            <summary><strong>M4', content)
    content = re.sub(r'(<details>\s*<summary><strong>M5)', r'<details id="cheat-m5">\n            <summary><strong>M5', content)
    
    # Insert jump nav after the first subsection (after manometer tracing section)
    # Find the end of the first subsection
    insert_after = '</div>\n        </div>\n        <div class="subsection">\n          <h4>Must-Know Formulas by Module</h4>'
    if 'Must-Know Formulas by Module' in content:
        content = content.replace(insert_after, jump_nav + '\n        <div class="subsection">\n          <h4>Must-Know Formulas by Module</h4>')
    
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {html_path}")

add_jump_nav('src/content/fm.html')
add_jump_nav('src/content/som.html')
add_jump_nav('src/content/thermo.html')
print("Jump navigation added to all cheat sheets!")