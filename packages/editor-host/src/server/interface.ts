import type {Logger} from '@oniichan/shared/logger';
import type {WorkspaceFileStructure} from '@oniichan/shared/dir';
import type {LoadingManager} from '../ui/loading.js';
import type {DiffViewManager} from '../ui/diff.js';
import type {TerminalManager} from '../utils/terminal/index.js';
import type {ResourceManager} from '../utils/resource.js';

export interface Context {
    loadingManager: LoadingManager;
    logger: Logger;
    diffViewManager: DiffViewManager;
    resourceManager: ResourceManager;
    terminalManager: TerminalManager;
    workspaceStructure: WorkspaceFileStructure;
}
