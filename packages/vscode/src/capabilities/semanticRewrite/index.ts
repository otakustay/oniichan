import {window, Disposable, TextEditor, commands, workspace, TextDocumentChangeEvent} from 'vscode';
import {FunctionUsageTelemetry} from '@oniichan/storage/telemetry';
import {getLanguageConfig} from '@oniichan/shared/language';
import {getSemanticRewriteConfiguration} from '../../utils/config';
import {LineTrack} from './track';

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

                    await this.executeSemanticRewrite(editor, 'command');
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

                    if (!this.isContextSuitableForAutomaticTrigger(window.activeTextEditor)) {
                        return;
                    }

                    await this.executeSemanticRewrite(window.activeTextEditor, 'automatic');
                }
            )
        );
    }

    private isContextSuitableForAutomaticTrigger(editor: TextEditor) {
        if (editor.document.lineCount > 400) {
            return false;
        }

        for (let i = 0; i < editor.document.lineCount; i++) {
            const line = editor.document.lineAt(i);
            if (line.range.end.character > 300) {
                return false;
            }
        }

        const hint = editor.document.lineAt(editor.selection.active.line).text;
        const language = getLanguageConfig(editor.document.languageId);

        if (language.isComment(hint)) {
            return false;
        }

        if (!language.endsWithIdentifier(hint)) {
            return false;
        }

        if (language.includesKeywordOnly(hint)) {
            return false;
        }

        return true;
    }

    private async executeSemanticRewrite(editor: TextEditor, trigger: string) {
        const telemetry = new FunctionUsageTelemetry(crypto.randomUUID(), 'semanticRewrite', {trigger});
        const uri = editor.document.uri.toString();
        const lineTrack = this.tracks.get(uri) ?? new LineTrack(uri);
        this.tracks.set(uri, lineTrack);
        await lineTrack.push(editor.selection.active.line, telemetry);
    }
}
