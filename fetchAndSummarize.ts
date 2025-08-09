import { createDocumentShim } from './htmlParserShim';
import { HUGGINGFACE_API_KEY } from '@env';//

const MAX_CHUNK_SIZE = 1000; // max chars per chunk for summary
const MAX_SUMMARY_CHUNKS = 5; // max number of chunks to summarize

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

      if (node.childNodes) {
        if (typeof node.childNodes.forEach === 'function') {
          node.childNodes.forEach(extractText);
        } else if (
          typeof node.childNodes.length === 'number' &&
          node.childNodes.length > 0
        ) {
          for (let i = 0; i < node.childNodes.length; i++) {
            extractText(node.childNodes[i]);
          }
        } else if (typeof node.childNodes === 'object') {
          // Defensive: single node object instead of array
          extractText(node.childNodes);
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

    // 4. Chunk text into pieces max MAX_CHUNK_SIZE length
    const chunks: string[] = [];
    for (let start = 0; start < cleanedText.length; start += MAX_CHUNK_SIZE) {
      const chunk = cleanedText.slice(start, start + MAX_CHUNK_SIZE);
      chunks.push(chunk);
      if (chunks.length >= MAX_SUMMARY_CHUNKS) break; // limit total chunks
    }

    // 5. Summarize each chunk via Hugging Face and combine results
    const summaries: string[] = [];

    for (const chunk of chunks) {
      const hfResponse = await fetch(
        'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: chunk }),
        }
      );

      if (!hfResponse.ok) {
        const errorBody = await hfResponse.text();
        throw new Error(
          `Hugging Face API error: ${hfResponse.status} ${hfResponse.statusText} - ${errorBody}`
        );
      }

      const result = await hfResponse.json();

      if (Array.isArray(result) && result[0]?.summary_text) {
        summaries.push(result[0].summary_text);
      } else {
        throw new Error('Unexpected response format from Hugging Face API.');
      }
    }

    // Combine summaries into one final summary
    return summaries.join(' ');
  } catch (error) {
    console.error('Error fetching and summarizing:', error);
    throw error;
  }
};
