import {assertNever} from '@oniichan/shared/error';
import type {MessageThreadWorkingMode} from '@oniichan/shared/inbox';

export function stringifyWorkingMode(mode: MessageThreadWorkingMode) {
    switch (mode) {
        case 'normal':
            return 'Oniichan';
        case 'ringRing':
            return 'Oniichan (Ring Ring Mode)';
        case 'couple':
            return 'Oniichan (Couple Mode)';
        default:
            assertNever<string>(mode, v => `Unknown working mode ${v}`);
    }
}
