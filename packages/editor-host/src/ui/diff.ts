import path from 'node:path';
import {commands, Uri, window, workspace, Disposable} from 'vscode';
import {DependencyContainer} from '@oniichan/shared/container';
import {tmpDirectory} from '@oniichan/shared/dir';
import {Logger} from '@oniichan/shared/logger';
import {stringifyError} from '@oniichan/shared/string';

const LABEL_PREFIX = '[Oniichan] Diff to ';

function formatDiffViewTitle(file: string) {
    return LABEL_PREFIX + file;
}

function extractFileFromLabel(label: string) {
    return label.startsWith(LABEL_PREFIX) ? label.slice(LABEL_PREFIX.length) : '';
}

export interface DiffViewInput {
    file: string;
    oldContent: string;
    newContent: string;
}

export interface DiffViewState {
    oldFile: string;
    newFile: string;
}

interface Dependency {
    [Logger.containerKey]: Logger;
}

export class DiffViewManager implements Disposable {
    static readonly containerKey = 'DiffViewManager';

    private readonly views = new Map<string, DiffViewState>();

    private readonly logger: Logger;

    private readonly disposable: Disposable;

    constructor(container: DependencyContainer<Dependency>) {
        this.logger = container.get(Logger);

        this.disposable = window.tabGroups.onDidChangeTabs(
            async e => {
                const closed = e.closed.map(v => extractFileFromLabel(v.label)).filter(v => !!v);
                for (const file of closed) {
                    this.cleanup(file);
                }
            }
        );
    }

    dispose() {
        this.disposable.dispose();

        for (const file of this.views.keys()) {
            this.cleanup(file);
        }
    }

    async open(input: DiffViewInput) {
        const directory = await tmpDirectory('inbox-diff');

        if (!directory) {
            throw new Error('Unable to use temp directory');
        }

        const {nanoid} = await import('nanoid');
        const extension = path.extname(input.file);
        const oldFile = path.join(directory, nanoid() + extension);
        const newFile = path.join(directory, nanoid() + extension);
        this.logger.trace('WriteFileStart', {oldFile, newFile});
        await workspace.fs.writeFile(Uri.file(oldFile), Buffer.from(input.oldContent));
        await workspace.fs.writeFile(Uri.file(newFile), Buffer.from(input.newContent));
        this.logger.trace('WriteFileFinish');

        const previous = this.views.get(input.file);
        if (previous) {
            this.logger.trace('ClosePreviousEditor');
            await this.close(input.file);
        }
        this.views.set(input.file, {oldFile, newFile});

        this.logger.trace('OpenDiffEditor');
        await commands.executeCommand(
            'vscode.diff',
            Uri.file(oldFile),
            Uri.file(newFile),
            formatDiffViewTitle(input.file),
            {preview: true}
        );
    }

    async close(file: string) {
        const title = formatDiffViewTitle(file);
        for (const tab of window.tabGroups.all.flatMap(v => v.tabs)) {
            if (tab.label === title) {
                await window.tabGroups.close(tab);
            }
        }

        this.cleanup(file);
    }

    private cleanup(file: string) {
        const state = this.views.get(file);
        if (state) {
            void this.tryDeleteTrash(state.oldFile);
            void this.tryDeleteTrash(state.newFile);
        }
        this.views.delete(file);
    }

    private async tryDeleteTrash(file: string | undefined) {
        if (!file) {
            return;
        }

        const uri = Uri.file(file);
        try {
            await workspace.fs.delete(uri);
        }
        catch (ex) {
            this.logger.warn(`DeleteTrachFail`, {reason: stringifyError(ex)});
        }
    }
}
