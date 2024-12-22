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
        background-color: var(--color-contrast-background);
        color: var(--color-contrast-foreground);
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
