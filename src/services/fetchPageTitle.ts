export async function fetchPageTitle(url: string): Promise<string> {
  const wiki = wikipediaTitle(url);
  if (wiki) return wiki;

  try {
    const res = await fetch(url);
    const html = await res.text();

    const title =
      html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];

    if (title) return clean(title);

    return hostname(url);
  } catch {
    return hostname(url);
  }
}

function wikipediaTitle(url: string) {
  try {
    const u = new URL(url);

    if (
      u.hostname.includes('wikipedia.org') &&
      u.pathname.startsWith('/wiki/')
    ) {
      const slug = decodeURIComponent(
        u.pathname.replace('/wiki/', '')
      );

      return clean(
        slug.replace(/_/g, ' ')
      );
    }

    return null;
  } catch {
    return null;
  }
}

function clean(text: string) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/ - Wikipedia$/, '')
    .replace(/\|.*$/, '')
    .trim();
}

function hostname(url: string) {
  try {
    const host = new URL(url).hostname
      .replace('www.', '')
      .split('.')[0];

    return host.charAt(0).toUpperCase() + host.slice(1);
  } catch {
    return 'Saved Article';
  }
}