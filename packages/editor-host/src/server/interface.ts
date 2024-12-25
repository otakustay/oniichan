import {ExtensionContext} from 'vscode';
import {Logger} from '@oniichan/shared/logger';
import {LoadingManager} from '../ui/loading';

export interface Context {
    loadingManager: LoadingManager;
    extensionHost: ExtensionContext;
    logger: Logger;
}
