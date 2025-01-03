import {ReactElement} from 'react';
import DiffCode from './DiffCode';
import TextCode from './TextCode';
import {useMarkdownContent} from './ContentProvider';

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

export default function CodeBlock({children, node}: Props) {
    if (!isCodeElement(children)) {
        return children;
    }

    const markdownText = useMarkdownContent();
    const closed = markdownText.slice(node.position.end.offset - 3, node.position.end.offset) === '```';
    const {className, children: code = ''} = children.props;
    const matches = /language-(\w+)(:(\S+)+)?/.exec(className ?? '');
    const language = matches?.at(1);
    const file = matches?.at(3);

    return file
        ? <DiffCode file={file} code={code} closed={closed} action={language} />
        : <TextCode language={language} code={code} closed={closed} />;
}
