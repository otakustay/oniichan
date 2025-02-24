import './color';
import {injectGlobal} from '@emotion/css';

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
injectGlobal`
    * {
        box-sizing: border-box;
    }

    html,
    body {
        margin: 0;
        padding: 0;
        -webkit-font-smoothing: antialiased;
        background-color: var(--color-root-background);
        color: var(--color-root-foreground);
        font-size: 14px;
    }

    code {
        font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
    }
`;

export const mediaWideScreen = 'min-width: 800px';
