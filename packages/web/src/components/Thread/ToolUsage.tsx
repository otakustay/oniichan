import {ComponentType} from 'react';
import styled from '@emotion/styled';
import {IoDocumentTextOutline, IoFolderOpenOutline, IoSearchOutline} from 'react-icons/io5';
import {trimPathString} from '@oniichan/shared/string';
import {ToolCallMessageChunk} from '@oniichan/shared/inbox';
import Markdown from '@/components//Markdown';

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

function renderLabelContent(input: ToolCallMessageChunk): [ComponentType, string, string] {
    switch (input.toolName) {
        case 'read_file':
            return [IoDocumentTextOutline, 'Read file', trimPathString(input.arguments.path ?? '')];
        case 'read_directory':
            return [IoFolderOpenOutline, 'Read directory', trimPathString(input.arguments.path ?? '')];
        case 'find_files_by_glob':
            return [IoSearchOutline, 'Find files', input.arguments.glob ?? ''];
        case 'find_files_by_regex':
            return [IoSearchOutline, 'Grep', input.arguments.regex ?? ''];
        case 'search_codebase':
            return [IoSearchOutline, 'Embedding', input.arguments.query ?? ''];
        default:
            throw new Error(`Unknown reference type`);
    }
}

interface Props {
    input: ToolCallMessageChunk;
}

export default function ToolUsage({input}: Props) {
    if (input.toolName === 'attempt_completion') {
        console.log('attempt completion');
        const {result, command} = input.arguments;
        const lines = [result];
        if (command) {
            lines.push(
                '',
                'You can run this command to verify this task.',
                '',
                '```shell',
                command,
                '```'
            );
        }
        return <Markdown content={lines.join('\n')} />;
    }

    const [Icon, action, content] = renderLabelContent(input);

    return (
        <Layout>
            <Icon />
            <ActionLabel>{action}</ActionLabel>
            <ContentLabel>{content}</ContentLabel>
        </Layout>
    );
}
