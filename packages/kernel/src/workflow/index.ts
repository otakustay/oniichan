import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {Logger} from '@oniichan/shared/logger';
import {Roundtrip} from '../inbox';
import {EditorHost} from '../editor';
import {CommandExecutor} from '../core/command';
import {WorkflowRunner, WorkflowRunnerInit} from './workflow';
import {ToolCallWorkflowRunner, ToolCallWorkflowRunnerInit} from './tool';

export interface WorkflowDetectorInit {
    threadUuid: string;
    taskId: string;
    systemPrompt: string;
    roundtrip: Roundtrip;
    editorHost: EditorHost;
    telemetry: FunctionUsageTelemetry;
    commandExecutor: CommandExecutor;
    logger: Logger;
    onUpdateThread: () => void;
}

export class WorkflowDetector {
    private readonly threadUuid: string;

    private readonly taskId: string;

    private readonly systemPrompt: string;

    private readonly roundtrip: Roundtrip;

    private readonly editorHost: EditorHost;

    private readonly telemetry: FunctionUsageTelemetry;

    private readonly logger: Logger;

    private readonly commandExecutor: CommandExecutor;

    private readonly onUpdateThread: () => void;

    constructor(init: WorkflowDetectorInit) {
        this.threadUuid = init.threadUuid;
        this.taskId = init.taskId;
        this.systemPrompt = init.systemPrompt;
        this.roundtrip = init.roundtrip;
        this.editorHost = init.editorHost;
        this.telemetry = init.telemetry;
        this.commandExecutor = init.commandExecutor;
        this.logger = init.logger.with({source: 'WorkflowDetector', taskId: init.taskId});
        this.onUpdateThread = init.onUpdateThread;
    }

    async detectWorkflow(): Promise<WorkflowRunner | null> {
        const messages = this.roundtrip.toMessages();
        const assistantTextMessage = this.roundtrip.getLatestTextMessageStrict();
        const toolCallMessage = await assistantTextMessage.toToolCallMessage(this.editorHost);

        if (!toolCallMessage) {
            return null;
        }

        const baseInit: Omit<WorkflowRunnerInit, 'workflow'> = {
            threadUuid: this.threadUuid,
            taskId: this.taskId,
            base: messages.filter(v => v !== assistantTextMessage),
            origin: toolCallMessage,
            telemetry: this.telemetry,
            logger: this.logger,
            commandExecutor: this.commandExecutor,
            onUpdateThrad: this.onUpdateThread,
        };
        const workflow = this.roundtrip.startWorkflowResponse(toolCallMessage);
        const init: ToolCallWorkflowRunnerInit = {
            ...baseInit,
            workflow,
            systemPrompt: this.systemPrompt,
            editorHost: this.editorHost,
            origin: toolCallMessage,
        };
        return new ToolCallWorkflowRunner(init);
    }
}
