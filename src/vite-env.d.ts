/// <reference types="vite/client" />

import "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "regular-table": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        ref?: React.RefObject<HTMLElement | null>;
      };
    }
  }
}
