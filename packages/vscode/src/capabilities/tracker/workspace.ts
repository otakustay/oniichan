import path from 'node:path';
import {Disposable, FileType, Uri, workspace} from 'vscode';
import {directories as defaultIgnoreDirectories} from 'ignore-by-default';
import {DependencyContainer} from '@oniichan/shared/container';
import {newUuid} from '@oniichan/shared/id';
import {Logger} from '@oniichan/shared/logger';
import {stringifyError} from '@oniichan/shared/error';
import {WebConnection} from '../web';

class FileSet {
    private readonly root: string;

    private readonly files = new Set<string>();

    constructor(root: string) {
        this.root = root;
    }

    toArray() {
        return [...this.files];
    }

    async add(files: readonly Uri[]) {
        const changes = await Promise.all(files.map(v => this.addSingle(v.fsPath)));
        return changes.some(v => v);
    }

    async delete(files: readonly Uri[]) {
        const changes = await Promise.all(files.map(v => this.deleteSingle(v.fsPath)));
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
    private readonly files: FileSet;

    private readonly logger: Logger;

    private readonly webConnection: WebConnection;

    private readonly disposables: Disposable[] = [];

    constructor(container: DependencyContainer<Dependency>) {
        // Extension will restart if the first workspace folder is changed,
        // so we can always get the correct folder path in class initialization.
        const root = workspace.workspaceFolders?.at(0)?.uri.fsPath ?? '';
        this.files = new FileSet(root);
        this.logger = container.get(Logger.containerKey).with({source: 'WorkspaceTracker'});
        this.webConnection = container.get(WebConnection.containerKey);
        this.disposables.push(
            workspace.onDidCreateFiles(e => this.change(e.files, [])),
            workspace.onDidDeleteFiles(e => this.change([], e.files))
        );

        if (root) {
            void this.initialList(root);
        }
    }

    dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
    }

    private async initialList(root: string) {
        const state: InitialLiseState = {count: 0, files: []};
        const options = {
            cwd: root,
            gitignore: true,
            ignore: defaultIgnoreDirectories().map(v => `**/${v}`),
            markDirectories: true,
            onlyFiles: false,
            dot: true,
        };
        this.logger.info('InitialListStart', {root});
        try {
            const {globbyStream} = await import('globby');
            for await (const file of globbyStream('**', options)) {
                state.count++;
                state.files.push(file.toString());

                // To allow user mention files early, push files to web chunk by chunk
                if (state.files.length >= 200) {
                    this.broadcastInitialChunk(state.files);
                }
            }
        }
        catch (ex) {
            this.logger.error('InitialListFail', {reason: stringifyError(ex)});
        }

        this.broadcastInitialChunk(state.files);
        this.logger.info('InitialListFinish', {root, count: state.count});
    }

    private broadcast() {
        const files = this.files.toArray();
        this.webConnection.broadcast(v => v.call(newUuid(), 'updateWorkspaceState', {files}));
    }

    private broadcastInitialChunk(files: string[]) {
        if (files.length) {
            this.files.addPrepared(files);
            this.broadcast();
        }
    }

    private async change(removed: readonly Uri[], added: readonly Uri[]) {
        // I'm afraid that removing and adding files concurrently can cause race conditions,
        // so here the removal is done before adding new files.
        const deleteHasChange = await this.files.delete(removed);
        const addHasChange = await this.files.add(added);
        if (deleteHasChange || addHasChange) {
            this.broadcast();
        }
    }
}
