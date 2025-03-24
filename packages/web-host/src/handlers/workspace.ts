import {getDefaultStore} from 'jotai';
import {RequestHandler} from '@otakustay/ipc';
import {workspaceFilesAtom} from '../atoms/workspace';
import type {WorkspaceState} from '../atoms/workspace';

export class UpdateWorkspaceStateHandler extends RequestHandler<Partial<WorkspaceState>, void> {
    static readonly action = 'updateWorkspaceState';

    // eslint-disable-next-line require-yield
    async *handleRequest(payload: Partial<WorkspaceState>): AsyncIterable<void> {
        const store = getDefaultStore();
        store.set(workspaceFilesAtom, current => ({...current, ...payload}));
    }
}
