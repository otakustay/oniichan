import {injectGlobal} from '@emotion/css';

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
injectGlobal`
    :root {
        --color-root-background: #f8f8f8;
        --color-root-foreground: #3b3b3b;
        --color-modal-mask: rgba(0, 0, 0, 0.5);
        --color-default-background: #fff;
        --color-default-background-hover: #f2f2f2;
        --color-default-foreground: #3b3b3b;
        --color-default-border: #e5e5e5;
        --color-contrast-background: #f8f8f8;
        --color-contrast-foreground: #e50000;
        --color-secondary-foreground: #666;
        --color-interactive-background: #015eb8;
        --color-interactive-background-hover: #2e72c1;
        --color-interactive-background-active: #407bc6;
        --color-interactive-background-disabled: #f8f8f8;
        --color-interactive-foreground: #fff;
        --color-interactive-foreground-disabled: var(--color-default-foreground);
        --color-link-foreground: var(--color-interactive-background);
        --color-link-foreground-hover: var(--color-interactive-background-hover);
        --color-link-foreground-active: var(--color-interactive-background-active);
    }

   @media (prefers-color-scheme: dark) {
        :root {
            --color-root-background: #181818;
            --color-root-foreground: #ccc;
            --color-modal-mask: rgba(0, 0, 0, 0.7);
            --color-default-background: #1f1f1f;
            --color-default-background-hover: ##2b2d2e;
            --color-default-foreground: #ccc;
            --color-default-border: #2b2b2b;
            --color-contrast-background: #181818;
            --color-contrast-foreground: #9cdcfe;
            --color-secondary-foreground: #aaa;
            --color-interactive-background: #0078d4;
            --color-interactive-background-hover: #4591dc;
            --color-interactive-background-active: #4391dc;
            --color-interactive-background-disabled: #181818;
            --color-interactive-foreground: #fff;
            --color-interactive-foreground-disabled: var(--color-default-foreground);
            --color-link-foreground: var(--color-interactive-background);
            --color-link-foreground-hover: var(--color-interactive-background-hover);
            --color-link-foreground-active: var(--color-interactive-background-active);
        }
    }
`;
