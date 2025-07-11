import {assertNever, stringifyError} from '@oniichan/shared/error';
import {assertToolCallMessage, createToolUseMessage} from '../../inbox/index.js';
import {WorkflowExecutor} from '../base/index.js';
import type {WorkflowExecuteResult} from '../base/index.js';
import type {ToolProviderInit, ToolExecuteResult} from '../../inbox/index.js';

export class ToolWorkflowExecutor extends WorkflowExecutor {
    async executeWorkflow(): Promise<WorkflowExecuteResult> {
        const origin = this.getToolCallMessage();
        const status = origin.getWorkflowOriginStatus();
        switch (status) {
            case 'waitingApprove':
                return this.checkAutoApprove();
            case 'userApproved':
                return this.runApprove();
            case 'userRejected':
                return this.runReject();
            case 'executing':
            case 'completed':
            case 'failed':
                this.logger.warn('ToolRunOnInvalidStatus', {messageUuid: origin.uuid, status});
                throw new Error(`Tool run on invalid stauts ${status}`);
            default:
                assertNever<string>(status, v => `Unexpected tool call status ${v}`);
        }
    }

    private createToolImplement() {
        const origin = this.getToolCallMessage();
        const chunk = origin.findToolCallChunkStrict();
        const init: ToolProviderInit = {
            thread: this.thread,
            roundtrip: this.roundtrip,
            editorHost: this.editorHost,
            logger: this.logger,
            commandExecutor: this.commandExecutor,
            inboxConfig: this.inboxConfig,
        };
        return this.role.provideToolImplement(chunk.toolName, init);
    }

    private async checkAutoApprove(): Promise<WorkflowExecuteResult> {
        const origin = this.getToolCallMessage();
        const implement = this.createToolImplement();
        const requireApprove = implement.requireUserApprove();

        if (requireApprove) {
            return {finished: true};
        }

        origin.markWorkflowOriginStatus('userApproved');
        return this.runApprove();
    }

    private async runApprove(): Promise<WorkflowExecuteResult> {
        const origin = this.getToolCallMessage();
        const chunk = origin.findToolCallChunkStrict();
        origin.markWorkflowOriginStatus('executing');
        const implement = this.createToolImplement();
        try {
            const result = await implement.executeApprove(chunk.arguments);
            origin.markWorkflowOriginStatus(result.type === 'success' ? 'completed' : 'failed');
            return this.handleFinishAndContinue(result);
        }
        catch (ex) {
            origin.markWorkflowOriginStatus('failed');
            this.logger.error(
                'ToolRunApproveFailed',
                {threadUuid: this.thread.uuid, messageUuid: origin.uuid, reason: stringifyError(ex)}
            );
            return {finished: true};
        }
    }

    private async runReject(): Promise<WorkflowExecuteResult> {
        const origin = this.getToolCallMessage();
        const implement = this.createToolImplement();
        try {
            const message = await implement.executeReject();
            origin.markWorkflowOriginStatus('userRejected');
            const result: ToolExecuteResult = {
                type: 'rejected',
                finished: false,
                executionData: {},
                template: message,
            };
            return this.handleFinishAndContinue(result);
        }
        catch (ex) {
            origin.markWorkflowOriginStatus('failed');
            this.logger.error(
                'ToolRunRejectFail',
                {threadUuid: this.thread.uuid, messageUuid: origin.uuid, reason: stringifyError(ex)}
            );
            return {finished: true};
        }
    }

    private handleFinishAndContinue(result: ToolExecuteResult) {
        const workflow = this.getWorkflow();
        const responseMessage = createToolUseMessage(this.roundtrip, result);
        workflow.markStatus('completed');
        workflow.addReaction(responseMessage, true);
        this.updateThread();
        return {finished: result.finished};
    }

    private getToolCallMessage() {
        const origin = this.getWorkflowOriginMessageStrict();
        assertToolCallMessage(origin);
        return origin;
    }
}
