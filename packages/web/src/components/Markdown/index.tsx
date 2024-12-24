import styled from '@emotion/styled';
import {ComponentType} from 'react';
import ReactMarkdown from 'react-markdown';
import CodeBlock from './CodeBlock';

const MarkdownContent = styled(ReactMarkdown)`
    p {
        &:first-child {
            margin-top: 0;
        }

        &:last-child {
            margin-bottom: 0;
        }
    }

    code {
        font-family: monospace;
        padding: 0 .5em;
        background-color: transparent;
        color: var(--color-contrast-foreground);
    }

    pre {
        background-color: transparent !important;
    }
`;

const components: Record<string, ComponentType<any>> = {
    pre: CodeBlock,
};

interface Props {
    content: string;
}

export default function Markdown({content}: Props) {
    return (
        <MarkdownContent components={components}>
            {content}
        </MarkdownContent>
    );
}
