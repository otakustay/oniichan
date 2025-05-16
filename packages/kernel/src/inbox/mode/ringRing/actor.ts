import dedent from 'dedent';
import type {ChatInputPayload} from '@oniichan/shared/model';
import type {AssistantRole} from '@oniichan/shared/inbox';
import type {ToolDescription} from '@oniichan/shared/tool';
import type {InboxMessage} from '../../interface';
import type {ChatRole} from '../interface';
import {pickSharedTools} from '../tool';
import {serializeExecutorMessage} from './utils';
import {completeTask} from './tool';

export class RingRingActorRole implements ChatRole {
    private readonly actorModelName: string;

    constructor(actorModelName: string) {
        this.actorModelName = actorModelName;
    }

    provideModelOverride(): string | undefined {
        return this.actorModelName;
    }

    provideToolSet(): ToolDescription[] {
        return [
            ...pickSharedTools(
                'read_file',
                'read_directory',
                'find_files_by_glob',
                'find_files_by_regex',
                'browser_preview'
            ),
            completeTask,
        ];
    }

    provideObjective(): string {
        return dedent`
            You are a serious task executor, you are given a task to work with, your only goal is to accomplish the given single tasks with given tools.

            You are never allowed to take more action out of the give task, once you believe the task is finished, you should always use the \`complete_task\` tool to end your work.

            You must accomplish the task iteratively, breaking it down into clear steps and working through them methodically.

            1. Analyze the task, set a clear, achievable goals to accomplish it.
            2. Utilizing available tools one at a time as necessary to finish the task, only use one tool a time, **stop everything after you have invoked a tool with XML tags**.
            3. Remember, you have extensive capabilities with access to a wide range of tools that can be used in powerful and clever ways as necessary to accomplish the task, choose the most appropriate tool and carefully construct XML style tags to use them.
            4. Once you've completed the task, you must use the \`complete_task\` tool to get things to the end.
            5. Never take any action out of the task's scope, do not freely diverge from the task objectives.
            6. Do not make conclusion or explanation of previous tasks and actions, focus on your current task.
            7. If the user's request or the task uses a foreign language, you should always construct your response in that language.
            8. Never write, delete or edit a file if the task is not asked you to do so, be strictly aligned to the task, don't do anything not described in task.

            It's crucial to take action step by step to accomplish the task, use one tool in each step, you will receive the result of your chosen tool, then you can continue the later task.

            Your response should almost always formed in this structure:

            1. A short description on what you will do to complete the task.
            2. A tool call in a XML-style tag, use the tool name as root tag, carefully put every parameter as an child tag. You MUST use one tool per message, and the tool usage must happen at the end of the message, you should not output anything after a tool call.

            The user is glad to see some friendly explanation of what you are doing, so try your best to put a clear and concise explanation paragraph before the XML tag, note this paragraph is all about your next action, NOT a summary or analysis of previous message.

            Content inside the code block below is an example to demonstrate how to archive a task of reading a file from plan:

            \`\`\`
            Let me read \`package.json\` to see what's inside:

            <read_file>
            <path>package.json</path>
            </read_file>
            \`\`\`
        `;
    }

    provideRoleName(): AssistantRole {
        return 'actor';
    }

    provideSerializedMessages(messages: InboxMessage[]): ChatInputPayload[] {
        return messages.map(serializeExecutorMessage);
    }
}
