import { DOMParser } from 'react-native-html-parser';

interface DOMNode {
  nodeName: string;
  childNodes?: DOMNode[];
  // Add other properties you need
}

export const createDocumentFromHtml = (html: string): Document => {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(html, 'text/html');

  // Type-safe implementation
  const getElementsByTagName = (tagName: string): NodeListOf<Element> => {
    const elements: Element[] = [];
    
    const walk = (node: DOMNode) => {
      if (node.nodeName === tagName.toUpperCase()) {
        elements.push(node as unknown as Element);
      }
      node.childNodes?.forEach(walk);
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
    } as unknown as NodeListOf<Element>;
  };

  const querySelector = (selector: string): Element | null => {
    // Basic implementation - only handles tag names
    if (!selector.startsWith('.') && !selector.startsWith('#')) {
      return getElementsByTagName(selector).item(0);
    }
    return null;
  };

  return {
    documentElement: parsed.documentElement as unknown as HTMLElement,
    body: parsed.documentElement as unknown as HTMLElement,
    head: parsed.documentElement as unknown as HTMLElement,
    title: '',
    URL: '',
    getElementsByTagName,
    querySelector,
    createElement: () => null as unknown as HTMLElement
  } as unknown as Document;
};