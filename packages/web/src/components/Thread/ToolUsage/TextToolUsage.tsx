import type {ComponentType} from 'react';
import styled from '@emotion/styled';
import {IoDocumentTextOutline, IoFolderOpenOutline, IoSearchOutline} from 'react-icons/io5';
import {isEditToolName} from '@oniichan/shared/tool';
import {ensureString, trimPathString} from '@oniichan/shared/string';
import type {ToolCallMessageChunk} from '@oniichan/shared/inbox';
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
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
`;

const ActionLabel = styled.span`
    color: var(--color-secondary-foreground);
    width: fit-content;
`;

function renderLabelContent(input: ToolCallMessageChunk): [ComponentType, string, string, string] {
    switch (input.toolName) {
        case 'read_file':
            return [
                IoDocumentTextOutline,
                'Read file',
                trimPathString(ensureString(input.arguments.path)),
                ensureString(input.arguments.path),
            ];
        case 'read_directory':
            return [
                IoFolderOpenOutline,
                'Read directory',
                trimPathString(ensureString(input.arguments.path)),
                ensureString(input.arguments.path),
            ];
        case 'find_files_by_glob':
            return [IoSearchOutline, 'Find files', ensureString(input.arguments.glob), ''];
        case 'find_files_by_regex':
            return [IoSearchOutline, 'Grep', ensureString(input.arguments.regex), ''];
        default:
            throw new Error(`Unknown reference type`);
    }
}

interface Props {
    input: ToolCallMessageChunk;
}

export default function TextToolUsage({input}: Props) {
    if (input.toolName === 'complete_task') {
        return null;
    }

    if (input.toolName === 'attempt_completion') {
        // Not neccessary to show command when tool is not validated
        const {result} = input.arguments;
        return result ? <Markdown content={ensureString(result)} /> : null;
    }

    if (input.toolName === 'ask_followup_question') {
        return input.arguments.question ? <Markdown content={ensureString(input.arguments.question)} /> : null;
    }

    if (isEditToolName(input.toolName)) {
        return (
            <FileEdit
                file={ensureString(input.arguments.path)}
                // `patch` for `patch_file`, `content` for `write_file`
                patch={ensureString(input.arguments.patch ?? input.arguments.content)}
                edit={null}
            />
        );
    }

    if (input.toolName === 'run_command') {
        return <CommandRun command={ensureString(input.arguments.command)} status={input.status} />;
    }

    if (input.toolName === 'browser_preview') {
        return <PreviewUrl url={ensureString(input.arguments.url)} closed={false} />;
    }

    const [Icon, action, parameter, title] = renderLabelContent(input);

    return (
        <ActBar
            icon={<Icon />}
            content={
                <>
                    <ActionLabel>{action}</ActionLabel>
                    {parameter && <ParameterLabel title={title}>{parameter}</ParameterLabel>}
                </>
            }
        />
    );
}
