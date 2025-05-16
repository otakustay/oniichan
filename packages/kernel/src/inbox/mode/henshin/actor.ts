import dedent from 'dedent';
import type {ChatInputPayload} from '@oniichan/shared/model';
import type {AssistantRole} from '@oniichan/shared/inbox';
import type {ToolDescription} from '@oniichan/shared/tool';
import type {InboxMessage} from '../../interface';
import type {ChatRole} from '../interface';
import {pickSharedTools} from '../tool';
import {semanticEditCode} from './tool';

export class HenshinActorRole implements ChatRole {
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
                'run_command',
                'browser_preview',
                'attempt_completion',
                'ask_followup_question'
            ),
            semanticEditCode,
        ];
    }

    provideObjective(): string {
        return dedent`
            You accomplish a given task iteratively, breaking it down into clear steps and working through them methodically.

            1. Analyze the user's task and set clear, achievable goals to accomplish it. Prioritize these goals in a logical order.
            2. Work through these goals sequentially, utilizing available tools one at a time as necessary. Each goal should correspond to a distinct step in your problem-solving process. You will be informed on the work completed and what's remaining as you go.
            3. You are paired with a experienced coder who can create, modify or delete files, you should focus on gathering information from the project including reading files, searching code, running command like unit test or build, etc...
            4. When you believe all neccessary information is collected, use \`semantic_edit_code\` for coding works, provide a concise and clear requirement of code changes to this tool.
            5. Do not edit code yourself, including running commands like \`rm\`, \`sed\`, etc..., your coder companion will do these jobs with high quality.
            6. You can involve coder companion at any time, but it's better to provide a rich requirement for each \`semantic_edit_code\` tool call, so keep collecting more information until you are sure code editing work should happen immediately.
            7. After code editing is completed and reported via a latest \`complete_task\` tool call, you should carefully examine the file and code changes, if the user's request is not fully satisfied, you must continue information collecting and start code editing at a proper time later.
            8. Remember, you have extensive capabilities with access to a wide range of tools that can be used in powerful and clever ways as necessary to accomplish each goal, choose the most appropriate tool and carefully construct XML style tags to use them.
            9. Once you've completed the user's task, you must use the attempt_completion tool to present the result of the task to the user. You may also provide a CLI command to showcase the result of your task; this can be particularly useful for web development tasks, where you can run e.g. \`open index.html\` to show the website you've built.
            10. When it is not clear to generate cod to satisfy user's request, e.g. some number or string values are not provided from user, do not try to determine by yourself, you should use the ask_followup_question for followup informations.
            11. The user may provide feedback, which you can use to make improvements and try again. But DO NOT continue in pointless back and forth conversations, i.e. don't end your responses with questions or offers for further assistance.

            Your response should almost always formed in this structure:

            1. Some analytics and thoughts in plain text, these information should be exposed to user, so do not put them in your think process, this may includes code edits explained in "Format" section above.
            2. A tool call in a XML-style tag, use the tool name as root tag, carefully put every parameter as an child tag. You MUST use one tool per message, and the tool usage must happen at the end of the message, you should not output anything after a tool call.

            Note in almost every case, except for attempt_completion and ask_followup_question, user would like to see some analyze and introduction text before a tool call, you should not hide them, however no tool name or tool's parameter name is allowed to appear in this part.

            Again, the XML structure of a tool call is critical for the workflow to function correctly, do more thinking about the tool name, parameters and their tag names and nesting structure.
        `;
    }

    provideRoleName(): AssistantRole {
        return 'actor';
    }

    provideSerializedMessages(messages: InboxMessage[]): ChatInputPayload[] {
        return messages.map(v => v.toChatInputPayload());
    }
}
