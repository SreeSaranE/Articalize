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

export async function fetchPageContent(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const html = await response.text();

    // Optionally remove scripts and styles for a cleaner content value:
    const cleanedContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<\/?[^>]+(>|$)/g, ' ') // strip HTML tags roughly
      .replace(/\s+/g, ' ') // normalize whitespace
      .trim();

    return cleanedContent;
  } catch (error) {
    console.error('Error fetching content:', error);
    return '';
  }
}
