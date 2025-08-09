declare module 'react-native-html-parser' {
  interface DOMNode {
    nodeName: string;
    childNodes: DOMNode[];
    textContent?: string;
    getAttribute?(name: string): string | null;
  }

  export class DOMParser {
    parseFromString(html: string, mimeType: string): {
      documentElement: DOMNode;
      querySelector?(selector: string): DOMNode | null;
    };
  }
}