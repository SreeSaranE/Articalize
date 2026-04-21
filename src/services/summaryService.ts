const HF_URL =
  'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';

const HF_TOKEN = 'PASTE_YOUR_HUGGINGFACE_KEY';

export async function summarizeFromUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    const html = await res.text();

    const text = stripHtml(html).slice(0, 3000);

    if (text.length < 100) {
      return 'Could not extract enough content.';
    }

    const response = await fetch(HF_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: text
      })
    });

    const json = await response.json();

    return json?.[0]?.summary_text || 'No summary available.';
  } catch {
    return 'Summary failed.';
  }
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}