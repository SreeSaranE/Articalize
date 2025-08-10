import { DOMParser } from 'react-native-html-parser';

const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('[xmldom warning]')) {
    return; // skip xmldom warnings
  }
  originalConsoleWarn(...args);
};

export const createDocumentShim = (html: string): any => {
  // Step 1: Clean up HTML before parsing
  const safeHtml = html
    .replace(/<script[\s\S]*?<\/script>/gi, '') // remove scripts
    .replace(/<style[\s\S]*?<\/style>/gi, '')   // remove styles
    .replace(/<!--[\s\S]*?(?=-->)(-->)/g, '')   // remove comments
    .replace(/\s(allowfullscreen)(?=\s|>)/gi, ' allowfullscreen="true"')
    .replace(/\s(itemscope)(?=\s|>)/gi, ' itemscope="true"')
    .replace(/\s(data-nosnippet)(?=\s|>)/gi, ' data-nosnippet="true"')
    .replace(/\s(news-link-class)(?=\s|>)/gi, ' news-link-class=""');

  let parsed: any;
  try {
    const parser = new DOMParser();
    parsed = parser.parseFromString(safeHtml, 'text/html');
  } catch (err) {
    console.warn('HTML parsing failed, falling back to empty document:', err);
    parsed = {};
  }

  // Step 2: Safe element search
  const getElementsByTagName = (tagName: string) => {
    const elements: any[] = [];

    const walk = (node: any) => {
      if (!node) return;
      if (node.nodeName && node.nodeName.toUpperCase() === tagName.toUpperCase()) {
        elements.push(node);
      }
      if (node.childNodes) {
        node.childNodes.forEach(walk);
      }
    };

    if (parsed.documentElement) {
      walk(parsed.documentElement);
    }

    return {
      length: elements.length,
      item: (index: number) => elements[index] || null,
      [Symbol.iterator]: function* () {
        for (let i = 0; i < elements.length; i++) {
          yield elements[i];
        }
      }
    };
  };

  const querySelector = (selector: string) => {
    if (!selector.startsWith('.') && !selector.startsWith('#')) {
      return getElementsByTagName(selector).item(0);
    }
    return null;
  };

  const querySelectorAll = (selector: string) => {
    if (!selector.startsWith('.') && !selector.startsWith('#')) {
      return getElementsByTagName(selector);
    }
    return { length: 0, item: () => null, [Symbol.iterator]: function* () {} };
  };

  // Step 3: Always return safe shim
  const docShim: any = {
    documentElement: parsed.documentElement || null,
    body: parsed.getElementsByTagName?.('body')?.[0] || parsed.documentElement || null,
    head: parsed.getElementsByTagName?.('head')?.[0] || { childNodes: [] },
    title: parsed.getElementsByTagName?.('title')?.[0]?.textContent || '',
    URL: '',
    getElementsByTagName,
    querySelector,
    querySelectorAll,
    createElement: (tag: string) => ({ nodeName: tag.toUpperCase(), childNodes: [] }),
    createTextNode: (text: string) => ({ nodeName: '#text', textContent: text })
  };

  return docShim;
};
