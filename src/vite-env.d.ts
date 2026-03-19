/// <reference types="vite/client" />

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "regular-table": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        ref?: React.RefObject<HTMLElement | null>;
      };
    }
  }
}

export {};
