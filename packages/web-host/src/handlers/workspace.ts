import {getDefaultStore} from 'jotai';
import {workspaceFilesAtom} from '../atoms/workspace';
import {RequestHandler} from '@otakustay/ipc';

export interface UpdateWorkspaceStateRequest {
    files: string[];
}

export class UpdateWorkspaceStateRequestHandler extends RequestHandler<UpdateWorkspaceStateRequest, void> {
    static readonly action = 'updateWorkspaceState';

    // eslint-disable-next-line require-yield
    async *handleRequest(payload: UpdateWorkspaceStateRequest): AsyncIterable<void> {
        const store = getDefaultStore();
        store.set(workspaceFilesAtom, payload.files);
    }
}
