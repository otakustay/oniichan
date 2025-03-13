import {Range, Uri, window, workspace, WorkspaceEdit} from 'vscode';
import type {TextEditor} from 'vscode';

export class TextEditorReference {
    private readonly uri: string;

    constructor(uri: string) {
        this.uri = uri;
    }

    getDocumentUri() {
        return this.uri;
    }

    getTextEditor(): TextEditor | null {
        const editor = window.visibleTextEditors.find(e => e.document.uri.toString() === this.uri);
        return editor ?? null;
    }

    getTextEditorWhenActive(): TextEditor | null {
        if (window.activeTextEditor?.document.uri.toString() === this.uri) {
            return window.activeTextEditor;
        }

        return null;
    }

    async applyReplacementEdit(range: Range, text: string, force = false): Promise<void> {
        const editor = this.getTextEditor();

        if (editor) {
            await editor.edit(builder => builder.replace(range, text));
            return;
        }

        if (force) {
            const edit = new WorkspaceEdit();
            edit.replace(
                Uri.parse(this.uri),
                range,
                text,
                {
                    needsConfirmation: false,
                    label: 'semantic rewrite from oniichan',
                }
            );
            await workspace.applyEdit(edit);
        }
    }
}
