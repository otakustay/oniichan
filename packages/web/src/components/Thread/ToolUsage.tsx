import {ComponentType} from 'react';
import styled from '@emotion/styled';
import {IoDocumentTextOutline, IoFolderOpenOutline, IoSearchOutline, IoTerminalOutline} from 'react-icons/io5';
import {trimPathString} from '@oniichan/shared/string';
import {ToolCallMessageChunk} from '@oniichan/shared/inbox';
import Markdown from '@/components//Markdown';
import ActBar from '@/components/ActBar';

const ParameterLabel = styled.span`
    background-color: var(--color-contrast-background);
    font-size: .8em;
    padding: .25em .5em;
    border-radius: .25em;
`;

const ActionLabel = styled.span`
    color: var(--color-secondary-foreground);
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
        case 'run_command':
            return [IoTerminalOutline, 'Run', input.arguments.command ?? ''];
        default:
            throw new Error(`Unknown reference type`);
    }
}

interface Props {
    input: ToolCallMessageChunk;
}

export default function ToolUsage({input}: Props) {
    if (input.toolName === 'attempt_completion') {
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

    if (input.toolName === 'ask_followup_question') {
        return input.arguments.question ? <Markdown content={input.arguments.question} /> : null;
    }

    const [Icon, action, parameter] = renderLabelContent(input);

    return (
        <ActBar
            icon={<Icon />}
            content={
                <>
                    <ActionLabel>{action}</ActionLabel>
                    {parameter && <ParameterLabel>{parameter}</ParameterLabel>}
                </>
            }
        />
    );
}
