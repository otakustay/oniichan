import type {ExtensionContext} from 'vscode';
import type {Logger} from '@oniichan/shared/logger';
import type {WorkspaceFileStructure} from '@oniichan/shared/dir';
import type {LoadingManager} from '../ui/loading';
import type {DiffViewManager} from '../ui/diff';
import type {TerminalManager} from '../utils/terminal';
import type {ResourceManager} from '../utils/resource';

export interface Context {
    loadingManager: LoadingManager;
    extensionHost: ExtensionContext;
    logger: Logger;
    diffViewManager: DiffViewManager;
    resourceManager: ResourceManager;
    terminalManager: TerminalManager;
    workspaceStructure: WorkspaceFileStructure;
}
