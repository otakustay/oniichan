import {ComponentType} from 'react';
import styled from '@emotion/styled';
import {IoDocumentTextOutline, IoFolderOpenOutline, IoSearchOutline} from 'react-icons/io5';
import {MessageToolUsage} from '@oniichan/shared/tool';
import {trimPathString} from '@oniichan/shared/string';

const Layout = styled.div`
    display: flex;
    align-items: center;
    gap: .5em;
    margin: 1em 0;
    border: 1px solid var(--color-default-border);
    border-radius: .5em;
    padding: .5em 1em;
    cursor: default;

    + & {
        margin-top: 0;
    }
`;

const ActionLabel = styled.span`
    color: var(--color-secondary-foreground);
`;

const ContentLabel = styled.span`
    background-color: var(--color-contrast-background);
    font-size: .8em;
    padding: .25em .5em;
    border-radius: .25em;
`;

function renderLabelContent(usage: MessageToolUsage): [ComponentType, string, string] {
    switch (usage.type) {
        case 'readFile':
            return [IoDocumentTextOutline, 'Read file', trimPathString(usage.args.path)];
        case 'readDirectory':
            return [IoFolderOpenOutline, 'Read direcotry', trimPathString(usage.args.path)];
        case 'findFiles':
            return [IoSearchOutline, 'Find files', usage.args.glob];
        default:
            throw new Error(`Unknown reference type`);
    }
}

interface Props {
    usage: MessageToolUsage;
}

export default function ToolUsage({usage}: Props) {
    const [Icon, action, content] = renderLabelContent(usage);

    return (
        <Layout>
            <Icon />
            <ActionLabel>{action}</ActionLabel>
            <ContentLabel>{content}</ContentLabel>
        </Layout>
    );
}
