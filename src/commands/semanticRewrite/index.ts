import {window, Disposable, TextEditor, commands, workspace, TextDocumentChangeEvent} from 'vscode';
import {LineTrack} from './track';
import {getSemanticRewriteConfiguration} from '../../utils/config';

function isNewLineOnly(event: TextDocumentChangeEvent): boolean {
    const changedText = event.contentChanges.at(-1)?.text ?? '';
    return /^\s*\n\s*$/.test(changedText);
}

export class SemanticRewriteCommand extends Disposable {
    private readonly disopsable: Disposable;

    private readonly tracks = new Map<string, LineTrack>();

    constructor() {
        super(() => void this.disopsable.dispose());

        this.disopsable = Disposable.from(
            commands.registerCommand(
                'oniichan.semanticRewrite',
                async () => {
                    const editor = window.activeTextEditor;

                    if (!editor) {
                        return;
                    }

                    await this.executeSemanticRewrite(editor);
                }
            ),
            workspace.onDidChangeTextDocument(
                async event => {
                    if (!event.contentChanges.length) {
                        return;
                    }

                    const track = this.tracks.get(event.document.uri.toString());
                    track?.updateTrack(event.contentChanges);

                    if (getSemanticRewriteConfiguration().triggerType !== 'Automatic') {
                        return;
                    }

                    if (event.document !== window.activeTextEditor?.document) {
                        return;
                    }

                    if (!isNewLineOnly(event)) {
                        return;
                    }

                    await this.executeSemanticRewrite(window.activeTextEditor);
                }
            )
        );
    }

    private async executeSemanticRewrite(editor: TextEditor) {
        const uri = editor.document.uri.toString();
        const lineTrack = this.tracks.get(uri) ?? new LineTrack(uri);
        this.tracks.set(uri, lineTrack);
        await lineTrack.push(editor.selection.active.line);
    }
}
