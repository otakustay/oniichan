import {Disposable} from 'vscode';
import type {Event} from 'vscode';

export function promisifyEvent<T>(event: Event<T>): Promise<T> & Disposable {
    const disposable: Disposable = {dispose: () => {}};
    const executor = (resolve: (value: T) => void) => {
        const subscription = event(resolve);
        disposable.dispose = () => {
            subscription.dispose();
        };
    };
    const result = new Promise(executor);
    return Object.assign(result, disposable);
}
