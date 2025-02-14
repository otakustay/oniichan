import {stringifyError} from '@oniichan/shared/error';
import {Logger} from '@oniichan/shared/logger';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {Message, Workflow, WorkflowOriginMessage} from '../inbox';

export interface WorkflowRunnerInit {
    threadUuid: string;
    taskId: string;
    base: Message[];
    origin: WorkflowOriginMessage;
    workflow: Workflow;
    telemetry: FunctionUsageTelemetry;
    logger: Logger;
    onUpdateThrad: () => void;
}

export interface WorkflowRunResult {
    /** Whether we should automatically request LLM again on workflow completion */
    finished: boolean;
}

export abstract class WorkflowRunner {
    protected readonly threadUuid: string;

    protected readonly base: Message[];

    protected readonly telemetry: FunctionUsageTelemetry;

    protected readonly origin: WorkflowOriginMessage;

    protected readonly taskId: string;

    protected readonly workflow: Workflow;

    private readonly onUpdateThread: () => void;

    constructor(init: WorkflowRunnerInit) {
        this.threadUuid = init.threadUuid;
        this.base = init.base;
        this.origin = init.origin;
        this.taskId = init.taskId;
        this.workflow = init.workflow;
        this.telemetry = init.telemetry;
        this.onUpdateThread = init.onUpdateThrad;
    }

    getWorkflow() {
        return this.workflow;
    }

    async run(): Promise<void> {
        try {
            const result = await this.execute();
            this.workflow.markStatus('completed');
            this.workflow.setContinueRoundtrip(!result.finished);
        }
        catch (ex) {
            this.workflow.markStatus('failed');
            this.origin.setError(stringifyError(ex));
            this.workflow.setContinueRoundtrip(false);
        }
    }

    protected abstract execute(): Promise<WorkflowRunResult>;

    protected updateThread() {
        this.onUpdateThread();
    }
}
