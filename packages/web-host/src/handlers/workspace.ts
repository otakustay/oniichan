import {getDefaultStore} from 'jotai';
import {workspaceFilesAtom, WorkspaceState} from '../atoms/workspace';
import {RequestHandler} from '@otakustay/ipc';

export class UpdateWorkspaceStateHandler extends RequestHandler<Partial<WorkspaceState>, void> {
    static readonly action = 'updateWorkspaceState';

    // eslint-disable-next-line require-yield
    async *handleRequest(payload: Partial<WorkspaceState>): AsyncIterable<void> {
        const store = getDefaultStore();
        store.set(workspaceFilesAtom, current => ({...current, ...payload}));
    }
}
