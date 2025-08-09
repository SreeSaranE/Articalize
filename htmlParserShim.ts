import { DOMParser } from 'react-native-html-parser';

export const createDocumentShim = (html: string): any => {
  const parser = new DOMParser();
  const parsed: any = parser.parseFromString(html, 'text/html'); // <-- Cast to any

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

  const docShim: any = {
    documentElement: parsed.documentElement,
    body: parsed.getElementsByTagName?.('body')?.[0] || parsed.documentElement,
    head: parsed.getElementsByTagName?.('head')?.[0] || { childNodes: [] },
    title: parsed.getElementsByTagName?.('title')?.[0]?.textContent || '',
    URL: '',
    getElementsByTagName,
    querySelector,
    querySelectorAll,
    createElement: (tag: string) => ({ nodeName: tag.toUpperCase(), childNodes: [] }),
    createTextNode: (text: string) => ({ nodeName: '#text', textContent: text }),
  };

  return docShim;
};
