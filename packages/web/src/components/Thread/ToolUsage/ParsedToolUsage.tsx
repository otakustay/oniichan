import {ComponentType} from 'react';
import styled from '@emotion/styled';
import {IoDocumentTextOutline, IoFolderOpenOutline, IoSearchOutline} from 'react-icons/io5';
import {trimPathString} from '@oniichan/shared/string';
import {isFileEditToolCallChunk, ParsedToolCallMessageChunk} from '@oniichan/shared/inbox';
import Markdown from '@/components//Markdown';
import ActBar from '@/components/ActBar';
import FileEdit from './FileEdit';
import PreviewUrl from './PreviewUrl';
import CommandRun from './CommandRun';

const ParameterLabel = styled.span`
    background-color: var(--color-contrast-background);
    font-size: .8em;
    padding: .25em .5em;
    border-radius: .25em;
`;

const ActionLabel = styled.span`
    color: var(--color-secondary-foreground);
`;

function renderLabelContent(input: ParsedToolCallMessageChunk): [ComponentType, string, string] {
    switch (input.toolName) {
        case 'read_file':
            return [IoDocumentTextOutline, 'Read file', trimPathString(input.arguments.path ?? '')];
        case 'read_directory':
            return [IoFolderOpenOutline, 'Read directory', trimPathString(input.arguments.path ?? '')];
        case 'find_files_by_glob':
            return [IoSearchOutline, 'Find files', input.arguments.glob ?? ''];
        case 'find_files_by_regex':
            return [IoSearchOutline, 'Grep', input.arguments.regex ?? ''];
        default:
            throw new Error(`Unknown reference type`);
    }
}

interface Props {
    input: ParsedToolCallMessageChunk;
}

export default function ParsedToolUsage({input}: Props) {
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
        return <Markdown content={input.arguments.question} />;
    }

    if (isFileEditToolCallChunk(input)) {
        const patch = input.toolName === 'write_file'
            ? input.arguments.content
            : (input.toolName === 'patch_file' ? input.arguments.patch : '');
        return (
            <FileEdit
                file={input.arguments.path ?? ''}
                patch={patch}
                edit={input.executionData}
            />
        );
    }

    if (input.toolName === 'run_command') {
        return <CommandRun command={input.arguments.command} status={input.status} />;
    }

    if (input.toolName === 'browser_preview') {
        return <PreviewUrl closed url={input.arguments.url} />;
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
