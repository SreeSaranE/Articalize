export async function summarizeFromUrl(url: string) {
  try {
    if (url.includes('wikipedia.org/wiki/')) {
      const slug = decodeURIComponent(
        url.split('/wiki/')[1].split('?')[0]
      );

      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`,
        {
          headers: {
            'User-Agent':
              'ArticalizeApp/1.0 (Personal Learning Project)',
            Accept: 'application/json'
          }
        }
      );

      const json = await res.json();

      return (
        json.extract ||
        'No Wikipedia content.'
      );
    }

    // generic fallback
    const page = await fetch(url);

    const html = await page.text();

    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return text
      .split(' ')
      .slice(0, 250)
      .join(' ');
  } catch (error) {
    console.log(error);
    return 'Extraction failed.';
  }
}