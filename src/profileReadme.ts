import { marked } from 'marked';

export async function fetchProfileReadme(username: string): Promise<string | null> {
  for (const branch of ['main', 'master']) {
    try {
      const res = await fetch(
        `https://raw.githubusercontent.com/${username}/${username}/${branch}/README.md`
      );
      if (res.ok) return res.text();
    } catch {
      // try next branch
    }
  }
  return null;
}

function sanitize(html: string): DocumentFragment {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  tpl.content.querySelectorAll('script, style, iframe').forEach(el => el.remove());
  tpl.content.querySelectorAll('*').forEach(el => {
    for (const attr of [...el.attributes]) {
      if (attr.name.startsWith('on')) el.removeAttribute(attr.name);
    }
  });
  return tpl.content;
}

export function renderProfileReadme(
  card: HTMLElement,
  container: HTMLElement,
  raw: string
) {
  const html = marked(raw) as string;
  container.innerHTML = '';
  container.appendChild(sanitize(html));
  card.style.display = 'block';
}
