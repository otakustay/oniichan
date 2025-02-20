import {ExtensionContext} from 'vscode';
import {Logger} from '@oniichan/shared/logger';
import {WorkspaceFileStructure} from '@oniichan/shared/dir';
import {LoadingManager} from '../ui/loading';
import {DiffViewManager} from '../ui/diff';
import {TerminalManager} from '../utils/terminal';
import {ResourceManager} from '../utils/resource';

export interface Context {
    loadingManager: LoadingManager;
    extensionHost: ExtensionContext;
    logger: Logger;
    diffViewManager: DiffViewManager;
    resourceManager: ResourceManager;
    terminalManager: TerminalManager;
    workspaceStructure: WorkspaceFileStructure;
}
