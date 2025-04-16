import {assertNever, stringifyError} from '@oniichan/shared/error';
import {assertToolCallMessage, createToolUseMessage} from '../../inbox';
import {WorkflowExecutor} from '../base';
import type {WorkflowStepInit, WorkflowExecuteResult} from '../base';
import {ToolImplement} from './implement';
import type {ToolExecuteResult, ToolImplementInit} from './implement';

export class ToolWorkflowExecutor extends WorkflowExecutor {
    private readonly implement: ToolImplement;

    constructor(init: WorkflowStepInit) {
        super(init);
        const implementInit: ToolImplementInit = {
            thread: this.thread,
            roundtrip: this.roundtrip,
            editorHost: init.editorHost,
            logger: init.logger,
            commandExecutor: init.commandExecutor,
            inboxConfig: init.inboxConfig,
        };
        this.implement = new ToolImplement(implementInit);
    }

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

    private async checkAutoApprove(): Promise<WorkflowExecuteResult> {
        const origin = this.getToolCallMessage();
        const chunk = origin.findToolCallChunkStrict();
        const requireApprove = this.implement.requireUserApprove(chunk.toolName);

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
        try {
            const result = await this.implement.executeApprove(chunk.toolName, chunk.arguments);
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
        const chunk = origin.findToolCallChunkStrict();
        try {
            const message = await this.implement.executeReject(chunk.toolName);
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
