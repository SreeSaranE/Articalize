import { createDocumentShim } from './htmlParserShim';
import { HUGGINGFACE_API_KEY } from '@env';
import { DEFAULT_DOMAINS } from './nonArticleDomains';

const HF_MODEL_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';

const cleanHTML = (html: string): string => {
  return html
    .replace(/<\s+/g, '<') // remove spaces after <
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[^\x00-\x7F]+/g, ''); // remove non-ASCII chars
};

const forEachChild = (nodeList: any, fn: (n: any) => void) => {
  if (!nodeList) return;
  if (typeof nodeList.forEach === 'function') {
    nodeList.forEach(fn);
  } else {
    for (let i = 0; i < nodeList.length; i++) fn(nodeList[i]);
  }
};

const getNodeText = (node: any): string => {
  let text = '';
  const walk = (n: any) => {
    if (!n) return;
    if (n.nodeName === '#text' && typeof n.textContent === 'string') {
      const t = n.textContent.trim();
      if (t) text += t + ' ';
    }
    forEachChild(n.childNodes, walk);
  };
  walk(node);
  return text.replace(/\s+/g, ' ').trim();
};

const collectParagraphs = (node: any): string[] => {
  const paras: string[] = [];
  const walk = (n: any) => {
    if (!n) return;
    if (n.nodeName && n.nodeName.toUpperCase() === 'P') {
      const txt = getNodeText(n);
      if (txt) paras.push(txt);
      return;
    }
    forEachChild(n.childNodes, walk);
  };
  walk(node);
  return paras;
};

const isJunkParagraph = (p: string) => {
  const lower = p.toLowerCase();
  if (lower.length < 50) return true;
  return [
    'this page includes',
    'is a disambiguation page',
    'coordinates:',
    'navigation menu'
  ].some(pat => lower.includes(pat));
};

export const fetchAndSummarize = async (url: string): Promise<string> => {
  try {
    const parsed = new URL(url);

    // Skip summarization for non-article domains
    if (DEFAULT_DOMAINS.some(domain => parsed.hostname.includes(domain))) {
      try {
        const resp = await fetch(url);
        const html = await resp.text();
        const doc = createDocumentShim(cleanHTML(html));
        const pageTitle = doc.getElementsByTagName('title')?.[0]?.textContent?.trim();
        return pageTitle || parsed.hostname;
      } catch {
        return parsed.hostname;
      }
    }

    // Fetch HTML
    const response = await fetch(url);
    const rawHtml = await response.text();
    const html = cleanHTML(rawHtml);

    // Parse HTML
    const doc = createDocumentShim(html);

    // Find best node
    let bestNode: any = doc.body || doc.documentElement;
    let bestScore = 0;

    const scoreNode = (n: any) => {
      if (!n?.nodeName) return 0;
      const tag = n.nodeName.toUpperCase();
      if (!['DIV', 'MAIN', 'ARTICLE', 'SECTION', 'BODY'].includes(tag)) return 0;
      const txt = getNodeText(n);
      let score = txt.length;
      const marker = `${n.id || ''} ${n.className || ''}`.toLowerCase();
      if (/content|article|main|post|page/.test(marker)) score += 2000;
      return score;
    };

    const walkScore = (node: any) => {
      if (!node) return;
      const s = scoreNode(node);
      if (s > bestScore) {
        bestScore = s;
        bestNode = node;
      }
      forEachChild(node.childNodes, walkScore);
    };

    walkScore(doc.documentElement);

    // Extract paragraphs
    let paragraphs = collectParagraphs(bestNode).filter(p => !isJunkParagraph(p));
    if (paragraphs.length === 0) {
      paragraphs = collectParagraphs(bestNode).filter(p => p.length > 40);
    }

    let inputText = paragraphs.slice(0, 5).join('\n\n') || getNodeText(bestNode);
    inputText = inputText.replace(/\s+/g, ' ').trim();

    // Validate input for Hugging Face
    const wordCount = inputText.split(/\s+/).length;
    if (wordCount < 50) {
      return inputText; // too short, return as-is
    }
    const truncatedText = inputText.slice(0, 3500);

    // Hugging Face request
    const hfResponse = await fetch(HF_MODEL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: truncatedText }),
    });

    if (!hfResponse.ok) {
      throw new Error(`Hugging Face API error: ${hfResponse.status} - ${await hfResponse.text()}`);
    }

    const result = await hfResponse.json();
    return result?.[0]?.summary_text?.trim() || inputText;
  } catch (err) {
    console.error('Error fetching and summarizing:', err);
    throw err;
  }
};
