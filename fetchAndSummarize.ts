// fetchAndSummarize.ts
import { createDocumentShim } from './htmlParserShim';
import { HUGGINGFACE_API_KEY } from '@env';

const HF_MODEL_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';

// small helper to safely iterate childNodes (NodeList or Array)
const forEachChild = (nodeList: any, fn: (n: any) => void) => {
  if (!nodeList) return;
  if (typeof nodeList.forEach === 'function') {
    nodeList.forEach(fn);
  } else if (typeof nodeList.length === 'number') {
    for (let i = 0; i < nodeList.length; i++) fn(nodeList[i]);
  }
};

// recursively extract text from a node (only text nodes)
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

// collect <p> elements under node (recursive)
const collectParagraphs = (node: any): string[] => {
  const paras: string[] = [];
  const walk = (n: any) => {
    if (!n) return;
    if (n.nodeName && n.nodeName.toUpperCase() === 'P') {
      const txt = getNodeText(n);
      if (txt) paras.push(txt);
      return; // don't descend past paragraphs
    }
    forEachChild(n.childNodes, walk);
  };
  walk(node);
  return paras;
};

// heuristic filter for junk paragraphs (hatnotes, nav, disambiguation, coordinates, etc.)
const isJunkParagraph = (p: string) => {
  const lower = p.toLowerCase();
  const junkPatterns = [
    'this page includes',
    'may refer to',
    'is a disambiguation page',
    'coordinates:',
    'see also',
    'navigation menu',
    'help us improve wikipedia',
    'from wikipedia',
    'edit section',
  ];
  // filter very short paragraphs
  if (lower.length < 50) return true;
  return junkPatterns.some(pat => lower.includes(pat));
};

export const fetchAndSummarize = async (url: string): Promise<string> => {
  try {
    // 0. If it's a Wikipedia page, use the REST summary endpoint (more accurate)
    try {
      const parsed = new URL(url);
      if (parsed.hostname && parsed.hostname.endsWith('wikipedia.org')) {
        // get the article title from the path (last segment)
        const parts = parsed.pathname.split('/');
        const title = decodeURIComponent(parts.pop() || parts.pop() || '');
        if (title) {
          const wikiApi = `https://${parsed.hostname}/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
          const wpResp = await fetch(wikiApi, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
          if (wpResp.ok) {
            const wpJson = await wpResp.json();
            // wpJson.extract is plain text summary (lead)
            if (wpJson?.extract && typeof wpJson.extract === 'string' && wpJson.extract.trim().length > 0) {
              console.log('[fetchAndSummarize] Wikipedia summary used for:', title);
              return wpJson.extract.trim();
            }
          } else {
            // log but fall through to HTML parsing if REST endpoint fails
            const errText = await wpResp.text().catch(() => '');
            console.warn(`[fetchAndSummarize] Wikipedia REST API failed: ${wpResp.status} ${wpResp.statusText} - ${errText}`);
          }
        }
      }
    } catch (e) {
      // URL parse failure -> continue with generic flow
      console.warn('[fetchAndSummarize] URL parse failed, continuing with generic extraction', e);
    }

    // 1. Fetch raw HTML
    const response = await fetch(url);
    const html = await response.text();

    // 2. Parse HTML with shim
    const doc = createDocumentShim(html);

    // 3. Find best content container heuristically:
    //    Walk nodes and score candidate nodes (DIV/MAIN/ARTICLE/SECTION/BODY).
    let bestNode: any = doc.body || doc.documentElement;
    let bestScore = 0;

    const scoreNode = (n: any) => {
      if (!n || !n.nodeName) return 0;
      const tag = String(n.nodeName).toUpperCase();
      // candidate tags
      if (!['DIV', 'MAIN', 'ARTICLE', 'SECTION', 'BODY'].includes(tag)) return 0;
      // compute text length
      const txt = getNodeText(n);
      let score = txt.length;
      // give priority if id/class contains content/article keywords
      try {
        const id = (typeof n.getAttribute === 'function' && n.getAttribute('id')) || n.id || '';
        const cls = (typeof n.getAttribute === 'function' && n.getAttribute('class')) || n.className || '';
        const marker = (id + ' ' + cls).toString().toLowerCase();
        if (/content|article|main|post|page|mw-content|mw-parser-output|entry/.test(marker)) score += 2000;
      } catch (_) {}
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

    walkScore(doc.documentElement || doc);

    // Debug log
    console.log('[fetchAndSummarize] bestNode chosen:', bestNode?.nodeName, 'score:', bestScore);

    // 4. Extract paragraphs from bestNode, filter junk, pick top paragraphs
    let paragraphs = collectParagraphs(bestNode);
    // filter out junk and extremely short ones
    paragraphs = paragraphs.filter(p => !isJunkParagraph(p));
    // if filtering removed everything, relax filter and keep paragraphs > 40 chars
    if (paragraphs.length === 0) {
      paragraphs = collectParagraphs(bestNode).filter(p => p.length > 40);
    }

    // If still empty, fallback to full text of bestNode and split into sentences / chunks
    let inputText = '';
    if (paragraphs.length > 0) {
      // take up to first 5 good paragraphs
      inputText = paragraphs.slice(0, 5).join('\n\n');
    } else {
      const fallback = getNodeText(bestNode);
      inputText = fallback.slice(0, 3000); // cap fallback length
    }

    inputText = inputText.replace(/\s+/g, ' ').trim();
    if (!inputText) throw new Error('No usable article text found for summarization.');

    // 5. Optional: if inputText is already short (<=300 chars), return it directly (no need to call HF)
    if (inputText.length <= 300) {
      console.log('[fetchAndSummarize] inputText is short — returning as-is (no HF call).');
      return inputText;
    }

    // 6. Prepare truncation for HF model (models have input limits). Adjust as necessary.
    const maxInputLen = 4000; // chars (tune based on model)
    const truncatedText = inputText.length > maxInputLen ? inputText.slice(0, maxInputLen) : inputText;

    // 7. Call Hugging Face summarization
    if (!HUGGINGFACE_API_KEY) {
      throw new Error('Hugging Face API key missing. Set HUGGINGFACE_API_KEY in .env');
    }

    const hfResponse = await fetch(HF_MODEL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: truncatedText }),
    });

    if (!hfResponse.ok) {
      const errorBody = await hfResponse.text().catch(() => '');
      throw new Error(`Hugging Face API error: ${hfResponse.status} ${hfResponse.statusText} - ${errorBody}`);
    }

    const result = await hfResponse.json();
    if (Array.isArray(result) && result[0]?.summary_text) {
      return result[0].summary_text.trim();
    }

    // Fallback if model returned unexpected shape
    if (typeof result?.summary_text === 'string') {
      return result.summary_text.trim();
    }

    // last resort: return first 500 chars of inputText
    return inputText.slice(0, 500) + (inputText.length > 500 ? '...' : '');
  } catch (err: any) {
    console.error('Error fetching and summarizing:', err);
    throw err;
  }
};
