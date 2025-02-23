import path from 'node:path';
import {Disposable, FileType, Uri, workspace, window} from 'vscode';
import {DependencyContainer} from '@oniichan/shared/container';
import {newUuid} from '@oniichan/shared/id';
import {Logger} from '@oniichan/shared/logger';
import {stringifyError} from '@oniichan/shared/error';
import {WebHostClient} from '@oniichan/web-host/client';
import {WorkspaceState} from '@oniichan/web-host/atoms/workspace';
import {streamingListEntries, WorkspaceFileStructure} from '@oniichan/shared/dir';
import {WebConnection} from '../web';

function addTrailingSlash(value: string) {
    return value.endsWith('/') ? value : value + '/';
}

interface Dependency {
    [WebConnection.containerKey]: WebConnection;
    [WorkspaceFileStructure.containerKey]: WorkspaceFileStructure;
    [Logger.containerKey]: Logger;
}

export class WorkspaceTracker implements Disposable {
    private readonly root: string;

    private readonly logger: Logger;

    private readonly webConnection: WebConnection;

    private readonly structure: WorkspaceFileStructure;

    private readonly disposables: Disposable[] = [];

    constructor(container: DependencyContainer<Dependency>) {
        // Extension will restart if the first workspace folder is changed,
        // so we can always get the correct folder path in class initialization.
        this.root = workspace.workspaceFolders?.at(0)?.uri.fsPath ?? '';
        this.logger = container.get(Logger.containerKey).with({source: 'WorkspaceTracker'});
        this.webConnection = container.get(WebConnection.containerKey);
        this.structure = container.get(WorkspaceFileStructure);
        this.disposables.push(
            workspace.onDidCreateFiles(e => this.change([], e.files)),
            workspace.onDidDeleteFiles(e => this.change(e.files, [])),
            window.onDidChangeActiveTextEditor(e => this.updateCurrentDocument(e?.document.uri)),
            this.webConnection.onDidConnect(client => this.initialPushWorkspaceState(client))
        );

        if (this.root) {
            void this.initializeWorkspaceState();
        }
    }

    dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
    }

    private toRelativePath(uri: Uri | undefined) {
        if (!uri) {
            return null;
        }

        const relative = path.relative(this.root, uri.fsPath);
        return relative.startsWith('..') ? null : relative;
    }

    private async pushWorkspaceState(client: WebHostClient, state: Partial<WorkspaceState>) {
        await client.call(newUuid(), 'updateWorkspaceState', state);
    }

    private broadcastWorkspaceState(state: Partial<WorkspaceState>) {
        this.webConnection.broadcast(v => this.pushWorkspaceState(v, state));
    }

    private async initializeWorkspaceState() {
        const buffer = {size: 0};
        const broadcast = () => {
            if (buffer.size) {
                const workspaceState = {
                    current: this.toRelativePath(window.activeTextEditor?.document.uri),
                    files: this.structure.toArray(),
                };
                this.webConnection.broadcast(v => this.pushWorkspaceState(v, workspaceState));
            }
        };
        this.logger.info('InitialListStart', {root: this.root});
        try {
            for await (const file of streamingListEntries(this.root)) {
                buffer.size++;
                this.structure.add(file);

                // To allow user mention files early, push files to web chunk by chunk
                if (buffer.size >= 200) {
                    broadcast();
                }
            }
        }
        catch (ex) {
            this.logger.error('InitialListFail', {reason: stringifyError(ex)});
        }

        broadcast();
        this.logger.info('InitialListFinish', {root: this.root, count: this.structure.count()});
    }

    private updateCurrentDocument(documentUri: Uri | undefined) {
        const state = {current: this.toRelativePath(documentUri)};
        this.broadcastWorkspaceState(state);
    }

    private async initialPushWorkspaceState(client: WebHostClient) {
        const state: WorkspaceState = {
            current: this.toRelativePath(window.activeTextEditor?.document.uri),
            files: this.structure.toArray(),
        };
        await this.pushWorkspaceState(client, state);
    }

    private async addUri(uri: Uri) {
        const file = this.toRelativePath(uri);

        if (!file) {
            return false;
        }

        try {
            const stat = await workspace.fs.stat(uri);
            const name = (stat.type & FileType.Directory) ? addTrailingSlash(file) : file;
            return this.structure.add(name);
        }
        catch {
            return this.structure.add(file);
        }
    }

    private deleteUri(uri: Uri) {
        const file = this.toRelativePath(uri);

        if (!file) {
            return false;
        }

        return this.structure.delete(file) || this.structure.delete(addTrailingSlash(file));
    }

    private async change(deleted: readonly Uri[], created: readonly Uri[]) {
        // I'm afraid that removing and adding files concurrently can cause race conditions,
        // so here the removal is done before adding new files.
        const deletions = deleted.map(v => this.deleteUri(v));
        const creations = await Promise.all(created.map(v => this.addUri(v)));
        if (deletions.some(v => v) || creations.some(v => v)) {
            const state = {files: this.structure.toArray()};
            this.broadcastWorkspaceState(state);
        }
    }
}
