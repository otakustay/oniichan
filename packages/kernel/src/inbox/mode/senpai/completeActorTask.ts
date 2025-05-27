import dedent from 'dedent';
import type {ToolDescription} from '@oniichan/shared/tool';
import {attemptCompletion} from '../tool';
import type {ToolExecuteResult} from '../tool';
import {AttemptCompletionToolImplement} from '../tool/attemptCompletion';

export const completeActorTask: ToolDescription = {
    ...attemptCompletion,
    description: dedent`
        When you feel that user request is accomplished, use this tool to summarize that you did.

        You need to provide a detailed list including every action in this process, this consits of:

        - Every file you read and a brief description of this file.
        - Every file you edit with the description of changes.
        - Every command you run and the description of command result.
        - Other relevant information like your thoughts and analysis results.

        Form these in a ordered list, one line for each description.
    `,
    parameters: {
        ...attemptCompletion.parameters,
        properties: {
            result: attemptCompletion.parameters.properties.result,
        },
    },
};

export class CompleteActorTaskToolImplement extends AttemptCompletionToolImplement {
    async executeApprove(): Promise<ToolExecuteResult> {
        return {
            type: 'success',
            finished: false,
            executionData: {},
            template: dedent`
                Now as a reviewer, you start to examine if all changes are qualified and well suited to user request.

                You are encouraged to excessively run commands and analyze file changes to make sure changes to this project does not cause any unexpected errors.

                If you confirm the task is finished with high quality, use <attempt_completion> tool to finish this conversation, otherwise use <ask_followup_question> to provide an instruction about what is left to complete.
            `,
        };
    }
}
