import {Message, Workflow, WorkflowOriginMessage} from '@oniichan/shared/inbox';

export interface WorkflowRunnerInit {
    threadUuid: string;
    taskId: string;
    base: Message[];
    origin: WorkflowOriginMessage;
    workflow: Workflow;
    onUpdateThrad: () => void;
}

export interface WorkflowRunResult {
    success: boolean;
}

// TODO: Missing solution to allow workflow runner request LLM with logs and streaming response
export abstract class WorkflowRunner {
    protected readonly threadUuid: string;

    protected readonly base: Message[];

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
        this.onUpdateThread = init.onUpdateThrad;
    }

    async run(): Promise<WorkflowRunResult> {
        try {
            await this.execute();
            this.workflow.markStatus('completed');
            return {success: true};
        }
        catch {
            this.workflow.markStatus('failed');
            return {success: false};
        }
    }

    protected abstract execute(): Promise<void>;

    protected updateThread() {
        this.onUpdateThread();
    }
}
