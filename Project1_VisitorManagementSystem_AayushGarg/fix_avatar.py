import re

func = '''
  private generateInitialsAvatar(name: string): string {
    const names = (name || '').trim().split(' ');
    let initials = '';
    if (names.length === 0) {
      initials = '?';
    } else if (names.length === 1) {
      initials = names[0].charAt(0).toUpperCase();
    } else {
      initials = names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
    }

    const colors = ['#f87171', '#fb923c', '#fbbf24', '#a3e635', '#4ade80', '#2dd4bf', '#38bdf8', '#818cf8', '#a78bfa', '#e879f9', '#fb7185'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = colors[Math.abs(hash) % colors.length];

    const svg = \<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="\"/><text x="50" y="50" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="40" font-weight="600" fill="#ffffff" text-anchor="middle" dominant-baseline="central" dy=".1em">\</text></svg>\;
    
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg.trim());
  }
'''

def fix_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = re.sub(r'  private generateInitialsAvatar\(name: string\): string \{.*?\n  \}', func, content, flags=re.DOTALL)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

fix_file('src/app/components/invite-form/invite-form.component.ts')
fix_file('src/app/components/walk-in-form/walk-in-form.component.ts')
