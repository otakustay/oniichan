import type {RawToolCallParameter} from '@oniichan/shared/inbox';

export function asString(value: RawToolCallParameter, trim = false) {
    return typeof value === 'string' ? (trim ? value.trim() : value) : undefined;
}
