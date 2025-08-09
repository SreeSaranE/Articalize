import { createDocumentShim } from './htmlParserShim';
import { HUGGINGFACE_API_KEY } from '@env';

export const fetchAndSummarize = async (url: string): Promise<string> => {
  try {
    // 1. Fetch raw HTML
    const response = await fetch(url);
    const html = await response.text();

    // 2. Parse HTML with shim
    const doc = createDocumentShim(html);

    // 3. Extract text recursively, safely checking childNodes
    let textContent = '';

    const extractText = (node: any) => {
      if (!node) return;

      if (node.nodeName === '#text' && node.textContent) {
        const trimmed = node.textContent.trim();
        if (trimmed) textContent += trimmed + ' ';
      }

      if (Array.isArray(node.childNodes)) {
        node.childNodes.forEach(extractText);
      } else if (node.childNodes && typeof node.childNodes.length === 'number') {
        // Handle NodeList-like objects
        for (let i = 0; i < node.childNodes.length; i++) {
          extractText(node.childNodes[i]);
        }
      }
    };

    if (doc.body) {
      extractText(doc.body);
    }

    const cleanedText = textContent.replace(/\s+/g, ' ').trim();
    if (!cleanedText) {
      throw new Error('No text content found in the provided URL.');
    }

    // 4. Summarize via Hugging Face
    const hfResponse = await fetch(
      'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: cleanedText }),
      }
    );

    if (!hfResponse.ok) {
      throw new Error(`Hugging Face API error: ${hfResponse.statusText}`);
    }

    const result = await hfResponse.json();
    if (Array.isArray(result) && result[0]?.summary_text) {
      return result[0].summary_text;
    } else {
      throw new Error('Unexpected response format from Hugging Face API.');
    }
  } catch (error) {
    console.error('Error fetching and summarizing:', error);
    throw error;
  }
};
