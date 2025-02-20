import path from 'node:path';
import {Disposable, FileType, Uri, workspace} from 'vscode';
import isAbsolute from 'is-absolute';
import {DependencyContainer} from '@oniichan/shared/container';
import {newUuid} from '@oniichan/shared/id';
import {Logger} from '@oniichan/shared/logger';
import {stringifyError} from '@oniichan/shared/error';
import {WebHostClient} from '@oniichan/web-host/client';
import {WebConnection} from '../web';
import {WorkspaceState} from '@oniichan/web-host/atoms/workspace';
import {window} from 'vscode';
import {streamingListEntries} from '@oniichan/shared/dir';

class FileSet {
    private readonly root: string;

    private readonly files = new Set<string>();

    constructor(root: string) {
        this.root = root;
    }

    toArray() {
        const toRelative = (file: string) => {
            if (isAbsolute(file)) {
                const relative = path.relative(this.root, file);
                return relative.startsWith('..') ? [] : relative;
            }
            return file;
        };
        return [...this.files].flatMap(toRelative);
    }

    async add(files: string[]) {
        const changes = await Promise.all(files.map(v => this.addSingle(v)));
        return changes.some(v => v);
    }

    async delete(files: string[]) {
        const changes = await Promise.all(files.map(v => this.deleteSingle(v)));
        return changes.some(v => v);
    }

    /**
     * Add already prepared files, this will not check the entry type of each file, directories must end with slash
     *
     * @param files files to add
     */
    addPrepared(files: string[]) {
        for (const file of files) {
            this.files.add(file);
        }
    }

    private async addSingle(file: string) {
        if (!this.root) {
            return false;
        }

        try {
            const stat = await workspace.fs.stat(this.toUri(file));

            if (stat.type & FileType.Directory) {
                return this.addValue(this.addTrailingSlash(file));
            }
            else {
                return this.addValue(file);
            }
        }
        catch {
            return this.addValue(file);
        }
    }

    private async deleteSingle(file: string) {
        if (!this.root) {
            return false;
        }

        return this.files.delete(file) || this.files.delete(this.addTrailingSlash(file));
    }

    private addValue(value: string) {
        const exists = this.files.has(value);
        this.files.add(value);
        return !exists;
    }

    private toUri(file: string) {
        return Uri.file(path.resolve(this.root, file));
    }

    private addTrailingSlash(value: string) {
        return value.endsWith('/') ? value : value + '/';
    }
}

interface Dependency {
    [WebConnection.containerKey]: WebConnection;
    [Logger.containerKey]: Logger;
}

interface InitialLiseState {
    count: number;
    files: string[];
}

export class WorkspaceTracker implements Disposable {
    private readonly root: string;

    private readonly files: FileSet;

    private readonly logger: Logger;

    private readonly webConnection: WebConnection;

    private readonly disposables: Disposable[] = [];

    constructor(container: DependencyContainer<Dependency>) {
        // Extension will restart if the first workspace folder is changed,
        // so we can always get the correct folder path in class initialization.
        this.root = workspace.workspaceFolders?.at(0)?.uri.fsPath ?? '';
        this.files = new FileSet(this.root);
        this.logger = container.get(Logger.containerKey).with({source: 'WorkspaceTracker'});
        this.webConnection = container.get(WebConnection.containerKey);
        this.disposables.push(
            workspace.onDidCreateFiles(e => this.change(e.files, [])),
            workspace.onDidDeleteFiles(e => this.change([], e.files)),
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
        const state: InitialLiseState = {count: 0, files: []};
        const broadcast = () => {
            if (state.files.length) {
                this.files.addPrepared(state.files);
                const workspaceState = {
                    current: this.toRelativePath(window.activeTextEditor?.document.uri),
                    files: this.files.toArray(),
                };
                this.webConnection.broadcast(v => this.pushWorkspaceState(v, workspaceState));
            }
        };
        this.logger.info('InitialListStart', {root: this.root});
        try {
            for await (const file of streamingListEntries(this.root)) {
                state.count++;
                state.files.push(file);

                // To allow user mention files early, push files to web chunk by chunk
                if (state.files.length >= 200) {
                    broadcast();
                }
            }
        }
        catch (ex) {
            this.logger.error('InitialListFail', {reason: stringifyError(ex)});
        }

        broadcast();
        this.logger.info('InitialListFinish', {root: this.root, count: state.count});
    }

    private updateCurrentDocument(documentUri: Uri | undefined) {
        const state = {current: this.toRelativePath(documentUri)};
        this.broadcastWorkspaceState(state);
    }

    private async initialPushWorkspaceState(client: WebHostClient) {
        const state: WorkspaceState = {
            current: this.toRelativePath(window.activeTextEditor?.document.uri),
            files: this.files.toArray(),
        };
        await this.pushWorkspaceState(client, state);
    }

    private async change(removed: readonly Uri[], added: readonly Uri[]) {
        const deleted = removed.map(v => this.toRelativePath(v)).filter(v => typeof v === 'string');
        const created = added.map(v => this.toRelativePath(v)).filter(v => typeof v === 'string');
        // I'm afraid that removing and adding files concurrently can cause race conditions,
        // so here the removal is done before adding new files.
        const deleteHasChange = await this.files.delete(deleted);
        const createHasChange = await this.files.add(created);
        if (deleteHasChange || createHasChange) {
            const state = {files: this.files.toArray()};
            this.broadcastWorkspaceState(state);
        }
    }
}
