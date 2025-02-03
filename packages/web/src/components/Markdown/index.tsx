import {ComponentType} from 'react';
import ReactMarkdown from 'react-markdown';
import CodeBlock from './CodeBlock';
import ContentProvider from './ContentProvider';

const components: Record<string, ComponentType<any>> = {
    pre: CodeBlock,
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
