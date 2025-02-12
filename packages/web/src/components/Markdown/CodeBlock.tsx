import {Suspense, ReactElement} from 'react';
import styled from '@emotion/styled';
import SourceCode from '@/components/SourceCode';
import LanguageIcon from '@/components/LanguageIcon';
import {useMarkdownContent} from './ContentProvider';
import {CopyCode} from './CopyCode';

interface CodeInPreProps {
    className?: string;
    children?: string;
}

interface CodeInPreElement {
    type: 'code';
    props: CodeInPreProps;
}

interface Position {
    line: number;
    column: number;
    offset: number;
}

interface NodePosition {
    start: Position;
    end: Position;
}

interface MarkdownNode {
    type: 'element';
    position: NodePosition;
}

interface Props {
    children: ReactElement;
    node: MarkdownNode;
}

function isCodeElement(element: any): element is CodeInPreElement {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return element?.type === 'code';
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

    pre {
        margin: 0;
        padding: 0;
    }

    code {
        all: unset;
    }
`;

export default function CodeBlock({children, node}: Props) {
    if (!isCodeElement(children)) {
        return children;
    }

    const markdownText = useMarkdownContent();
    const closed = markdownText.slice(node.position.end.offset - 3, node.position.end.offset) === '```';
    const {className, children: code = ''} = children.props;
    const matches = /language-(\w+)?/.exec(className ?? '');
    const language = matches?.at(1);

    return (
        <Layout>
            <Header>
                <LanguageIcon mode="language" value={language} />
                <LanguageLabel>{language}</LanguageLabel>
                {closed && <CopyCode text={code + '\n'} />}
            </Header>
            <SourceCodeLayout>
                <Suspense fallback={<SourceCode.NoHighlight code={code} language={language} />}>
                    <SourceCode code={code} language={language} />
                </Suspense>
            </SourceCodeLayout>
        </Layout>
    );
}
