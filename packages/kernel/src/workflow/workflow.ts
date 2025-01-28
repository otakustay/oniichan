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
    /** Whether we should automatically request LLM again on workflow completion */
    autoContinue: boolean;
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
            const result = await this.execute();
            this.workflow.markStatus('completed');
            return result;
        }
        catch {
            this.workflow.markStatus('failed');
            return {autoContinue: false};
        }
    }

    protected abstract execute(): Promise<WorkflowRunResult>;

    protected updateThread() {
        this.onUpdateThread();
    }
}
