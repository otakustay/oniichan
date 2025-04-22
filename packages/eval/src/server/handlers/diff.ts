import type {FileEditData, FileEditResult} from '@oniichan/shared/patch';
import type {AcceptFileEditRequest, AppliableState} from '@oniichan/editor-host/protocol';
import {RequestHandler} from './handler';

export class CheckEditAppliableHandler extends RequestHandler<FileEditData[], AppliableState> {
    static readonly action = 'checkEditAppliable';

    // eslint-disable-next-line require-yield
    async *handleRequest() {
        throw new Error('Not implemented');
    }
}

export class RenderDiffViewHandler extends RequestHandler<FileEditResult, void> {
    static readonly action = 'renderDiffView';

    async *handleRequest(): AsyncIterable<void> {
    }
}

export class AcceptFileEditHandler extends RequestHandler<AcceptFileEditRequest, void> {
    static readonly action = 'acceptFileEdit';

    async *handleRequest(): AsyncIterable<void> {
    }
}
