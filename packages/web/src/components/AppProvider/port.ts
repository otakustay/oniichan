import {ExecutionMessage, Port, isExecutionMessage} from '@otakustay/ipc';

export class WebSocketPort implements Port {
    private readonly socket: WebSocket;

    constructor(socket: WebSocket) {
        this.socket = socket;
    }

    send(message: ExecutionMessage): void {
        this.socket.send(JSON.stringify(message));
    }

    listen(callback: (message: ExecutionMessage) => void): void {
        this.socket.addEventListener(
            'message',
            (event: MessageEvent<string>) => {
                try {
                    const data = JSON.parse(event.data);
                    if (isExecutionMessage(data)) {
                        callback(data);
                    }
                }
                catch {
                    // Discard incorrect JSON messages
                }
            }
        );
    }
}

export class VscodeMessagePort implements Port {
    private readonly vscode = acquireVsCodeApi();

    send(message: ExecutionMessage): void {
        this.vscode.postMessage(message);
    }

    listen(callback: (message: ExecutionMessage) => void): void {
        window.addEventListener(
            'message',
            (event: MessageEvent) => {
                try {
                    if (isExecutionMessage(event.data)) {
                        callback(event.data);
                    }
                }
                catch {
                    // Discard incorrect JSON messages
                }
            }
        );
    }
}
