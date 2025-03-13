import type {ComponentType} from 'react';
import ReactMarkdown from 'react-markdown';
import CodeBlock from './CodeBlock';
import ContentProvider from './ContentProvider';
import InlineCode from './InlineCode';

const components: Record<string, ComponentType<any>> = {
    pre: CodeBlock,
    code: InlineCode,
};

interface Props {
    content: string;
}

export default function Markdown({content}: Props) {
    return (
        <ContentProvider content={content}>
            <ReactMarkdown components={components}>
                {content}
            </ReactMarkdown>
        </ContentProvider>
    );
}
