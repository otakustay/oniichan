import {WorkflowStep} from './step';
import type {WorkflowStepInit} from './step';
import type {WorkflowDetector} from './detector';
import type {WorkflowValidator} from './validator';
import type {WorkflowInitializer} from './initializer';
import type {WorkflowExecutor} from './executor';
import {stringifyError} from '@oniichan/shared/error';

interface WorkflowRunnerChildren {
    detector: WorkflowDetector;
    validator: WorkflowValidator;
    initializer: WorkflowInitializer;
    executor: WorkflowExecutor;
}

export abstract class WorkflowRunner extends WorkflowStep {
    private readonly detector: WorkflowDetector;

    private readonly validator: WorkflowValidator;

    private readonly initializer: WorkflowInitializer;

    private readonly executor: WorkflowExecutor;

    constructor(init: WorkflowStepInit, children: WorkflowRunnerChildren) {
        super(init);
        this.detector = children.detector;
        this.validator = children.validator;
        this.initializer = children.initializer;
        this.executor = children.executor;
    }

    detect() {
        try {
            const source = this.getWorkflowSourceMessage();
            if (source) {
                return this.detector.detectWorkflow(source);
            }

            const origin = this.getWorkflowOriginMessage();
            if (origin) {
                return this.detector.ableToHandleWorkflow(origin);
            }

            this.logger.warn('NotRunnable');
            return false;
        }
        catch {
            return false;
        }
    }

    async run() {
        if (this.isInWorkflow()) {
            await this.execute();
            return;
        }

        const isValid = await this.validate();
        if (isValid) {
            await this.execute();
        }
    }

    private getWorkflow() {
        return this.roundtrip.getLatestWorkflowStrict();
    }

    private async validate() {
        const source = this.getWorkflowSourceMessageStrict();
        source.markWorkflowSourceStatus('waitingValidate');

        try {
            const isValid = await this.validator.validateWorkflow();
            source.markWorkflowSourceStatus(isValid ? 'validated' : 'validateError');

            if (!isValid) {
                source.setError('Cannot start task due to validation error');
            }

            return isValid;
        }
        catch (ex) {
            source.markWorkflowSourceStatus('validateError');
            source.setError(stringifyError(ex));
            return false;
        }
        finally {
            this.updateThread();
        }
    }

    private async execute() {
        if (!this.isInWorkflow()) {
            try {
                const origin = await this.initializer.createWorkflowOrigin();
                origin.markWorkflowOriginStatus('waitingApprove');
                this.roundtrip.startWorkflowResponse(origin);
            }
            catch (ex) {
                const message = this.getWorkflowSourceMessage() ?? this.getWorkflowOriginMessage();
                if (message) {
                    message.setError(stringifyError(ex));
                }
                this.logger.error('CreateWorkflowOriginFail', {reason: stringifyError(ex)});
            }
            finally {
                this.updateThread();
            }
        }

        const workflow = this.getWorkflow();
        const origin = workflow.getOriginMessage();
        try {
            const result = await this.executor.executeWorkflow();
            const status = origin.getWorkflowOriginStatus();
            if (status === 'completed' || status === 'failed' || status === 'userRejected') {
                workflow.markStatus('completed');
            }
            workflow.setContinueRoundtrip(!result.finished);
        }
        catch (ex) {
            workflow.markStatus('failed');
            workflow.setContinueRoundtrip(false);
            const origin = workflow.getOriginMessage();
            origin.setError(stringifyError(ex));
        }
        finally {
            this.updateThread();
        }
    }
}
