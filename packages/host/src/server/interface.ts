import {ExtensionContext} from 'vscode';
import {LoadingManager} from '../ui/loading';

export interface Context {
    loadingManager: LoadingManager;
    extensionHost: ExtensionContext;
}
