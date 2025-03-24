import {Suspense} from 'react';
import type {ReactElement} from 'react';
import styled from '@emotion/styled';
import {useMarkdownContent} from './ContentProvider';
import {CopyCode} from './CopyCode';
import SourceCode from '@/components/SourceCode';
import LanguageIcon from '@/components/LanguageIcon';

interface Position {
    line: number;
    column: number;
    offset: number;
}

interface NodePosition {
    start: Position;
    end: Position;
}

interface MarkdownTextNode {
    type: 'text';
    value: string;
    position: NodePosition;
}

interface PropertyMap {
    className?: string[];
}

interface MarkdownElementNode {
    type: 'element';
    tagName: string;
    position: NodePosition;
    properties?: PropertyMap;
    children?: MarkdownNode[];
}

type MarkdownNode = MarkdownTextNode | MarkdownElementNode;

interface Props {
    children: ReactElement;
    node: MarkdownNode;
}

function onlyChild(node: MarkdownNode): MarkdownNode | null {
    if (node.type !== 'element' || node.children?.length !== 1) {
        return null;
    }

    return node.children[0];
}

interface SourceCodeData {
    code: string;
    language: string;
}

function findSourceCode(node: MarkdownNode): SourceCodeData | null {
    const child = onlyChild(node);

    if (!child || child.type !== 'element') {
        return null;
    }

    const text = onlyChild(child);

    return text?.type === 'text'
        ? {
            code: text.value,
            language: /language-(\w+)?/.exec(child.properties?.className?.at(0) ?? '')?.at(1) ?? '',
        }
        : null;
}

const Header = styled.div`
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: .5em;
    align-items: center;
    justify-content: space-between;
    height: 2.5em;
    padding: 0 1em;
    border-radius: .5em .5em 0 0;
    border: 1px solid var(--color-default-border);
    border-bottom: none;
    background-color: var(--color-contrast-background);
`;

const LanguageLabel = styled.span`
    font-family: monospace;
`;

const SourceCodeLayout = styled.div`
    border: 1px solid var(--color-default-border);
    padding: .5em;
    border-radius: 0 0 .5em .5em;
`;

const Layout = styled.div`
    margin: 0;
    overflow: hidden;

    & :where(pre) {
        margin: 0;
        padding: 0;
    }

    & :where(code) {
        all: unset;
    }
`;

export default function CodeBlock({children, node}: Props) {
    const source = findSourceCode(node);

    if (source === null) {
        return children;
    }

    const markdownText = useMarkdownContent();
    const closed = markdownText.slice(node.position.end.offset - 3, node.position.end.offset) === '```';

    // Some model tends to put tool call XML in a code block, it looks like:
    //
    // ```
    // I need to read `src/main.ts`.
    //
    // ```xml
    // <read_file>
    //   <path>src/main.ts</path>
    // </read_file>
    // ```
    // ```
    //
    // This will results 2 empty code blocks, we are omiiting them from message content.
    if (!source.code.trim()) {
        return null;
    }

    return (
        <Layout>
            <Header>
                <LanguageIcon mode="language" value={source.language} />
                <LanguageLabel>{source.language}</LanguageLabel>
                {closed && <CopyCode text={source.code + '\n'} />}
            </Header>
            <SourceCodeLayout>
                <Suspense fallback={<SourceCode.NoHighlight code={source.code} language={source.language} />}>
                    <SourceCode code={source.code} language={source.language} />
                </Suspense>
            </SourceCodeLayout>
        </Layout>
    );
}
