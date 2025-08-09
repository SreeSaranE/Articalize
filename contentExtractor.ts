export const extractMainContent = (html: string): {
  title: string;
  content: string;
  excerpt: string;
} => {
  // First try to extract title
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  const title = titleMatch?.[1] || 'Untitled Article';

  // Simple but effective content extraction
  let content = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')  // Remove scripts
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')    // Remove styles
    .replace(/<[^>]+>/g, ' ')                          // Remove all tags
    .replace(/\s+/g, ' ')                              // Collapse whitespace
    .trim();

  // If we got very little content, try a different approach
  if (content.length < 100) {
    content = html
      .replace(/<[^>]+>/g, ' ')  // Fallback: just remove all tags
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Create excerpt (first 150 chars of meaningful content)
  const excerpt = content.substring(0, 150) + (content.length > 150 ? '...' : '');

  return {
    title,
    content,
    excerpt
  };
};