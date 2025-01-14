import {useDocumentEvent} from 'huse';

export interface ShortcutOptions {
    key: string;
    metaOrCtrl?: boolean;
    shift?: boolean;
    alt?: boolean;
}

export function useKeyboardShortcut(options: ShortcutOptions, callback: () => void) {
    useDocumentEvent(
        'keyup',
        e => {
            if (e.target instanceof HTMLElement) {
                if (e.target.nodeName === 'INPUT' || e.target.nodeName === 'TEXTAREA') {
                    return;
                }
            }

            if (options.alt && !e.altKey) {
                return;
            }
            if (options.shift && !e.shiftKey) {
                return;
            }
            if (options.metaOrCtrl && !e.ctrlKey && !e.metaKey) {
                return;
            }
            if (e.key.toLowerCase() !== options.key.toLowerCase()) {
                return;
            }

            callback();
        }
    );
}
