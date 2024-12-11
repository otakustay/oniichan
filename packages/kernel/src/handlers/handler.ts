import {RequestHandler as BaseRequestHandler} from '@otakustay/ipc';
import {EditorHost} from '../host';

export interface Context {
    editorHost: EditorHost;
}

export abstract class RequestHandler<I, O> extends BaseRequestHandler<I, O, Context> {
}
