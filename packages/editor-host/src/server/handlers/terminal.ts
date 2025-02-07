import {RequestHandler} from '@otakustay/ipc';
import {ExecuteStatus} from '../../utils/terminal';
import {Context} from '../interface';

export interface ExecuteTerminalRequest {
    command: string;
    cwd: string;
    timeout: number;
}

export interface ExecuteTerminalResponse {
    status: ExecuteStatus;
    exitCode: number | null;
    output: string;
}

export class ExecuteTerminalHandler extends RequestHandler<ExecuteTerminalRequest, ExecuteTerminalResponse, Context> {
    static readonly action = 'executeTerminal';

    async *handleRequest(payload: ExecuteTerminalRequest): AsyncIterable<ExecuteTerminalResponse> {
        const {logger, terminalManager} = this.context;

        logger.info('Start', payload);

        const terminal = await terminalManager.getTerminal(payload.cwd);
        logger.trace('TerminalReady', {shellIntegration: !!terminal.hasShellIntegration()});

        const result = await terminal.execute(payload.command, payload.timeout);
        logger.info('Finish', result);

        yield {
            status: result.status,
            exitCode: result.exitCode,
            output: result.output,
        };
    }
}
