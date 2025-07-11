import ora from 'ora';
import type {Ora} from 'ora';
import Spinnies from 'spinnies';
export type TaskStatus = 'running' | 'success' | 'fail';

export interface Spinner {
    update(status: TaskStatus, message: string): Promise<void>;
    addChild(name: string, message: string): Promise<Spinner>;
}

export class DefaultSpinner implements Spinner {
    private readonly indent: number;

    private ora: Ora | null = null;

    constructor(indent?: number) {
        this.indent = indent ?? 0;
    }

    async update(status: TaskStatus, message: string) {
        this.ora ??= ora({text: message, indent: this.indent, hideCursor: false, discardStdin: false}).start();

        switch (status) {
            case 'running':
                this.ora.text = message;
                break;
            case 'success':
                this.ora.succeed(message);
                break;
            case 'fail':
                this.ora.fail(message);
                break;
        }
    }

    async addChild(message: string): Promise<Spinner> {
        const child = new DefaultSpinner(this.indent + 1);
        await child.update('running', message);
        return child;
    }
}

class ConcurrentChildSpinner implements Spinner {
    private readonly parent: Spinner;

    private readonly name: string;

    constructor(name: string, parent: Spinner) {
        this.name = name;
        this.parent = parent;
    }

    async update(): Promise<void> {
        await this.parent.update('running', this.name);
    }

    async addChild(name: string): Promise<Spinner> {
        return new ConcurrentChildSpinner(name, this.parent);
    }
}

export class ConcurrentSpinner implements Spinner {
    private static list = new Spinnies();

    private readonly name: string;

    private status: TaskStatus = 'running';

    constructor(name: string) {
        this.name = name;
        ConcurrentSpinner.list.add(this.name, {text: name});
    }

    async update(status: TaskStatus, message: string): Promise<void> {
        if (this.status === 'running') {
            ConcurrentSpinner.list.update(this.name, {status: this.toStatus(status), text: message});
        }

        this.status = status;
    }

    async addChild(name: string): Promise<Spinner> {
        return new ConcurrentChildSpinner(name, this);
    }

    private toStatus(status: TaskStatus) {
        switch (status) {
            case 'running':
                return 'spinning';
            case 'fail':
                return 'fail';
            case 'success':
                return 'succeed';
            default:
                return status;
        }
    }
}
