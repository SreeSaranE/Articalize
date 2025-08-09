declare module 'domhandler' {
  export interface Element {
    type: string;
    name?: string;
    attribs?: { [key: string]: string };
    children?: Element[];
    data?: string;
  }
}
