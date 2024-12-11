import crypto from 'node:crypto';

export function newUuid(existed?: string | null) {
    return existed ?? crypto.randomUUID();
}
