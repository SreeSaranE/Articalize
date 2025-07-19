export async function fetchPageTitle(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const html = await response.text();

    const match = html.match(/<title>(.*?)<\/title>/i);
    if (match && match[1]) {
      return match[1].trim();
    } else {
      return 'Untitled Article';
    }
  } catch (error) {
    console.error('Error fetching title:', error);
    return 'Untitled Article';
  }
}
