import { CompletionItemKind, languages} from 'vscode';
import type {CompletionItemProvider, ProviderResult, TextDocument,CompletionItem, Disposable, Position} from 'vscode';
import type {DependencyContainer} from '@oniichan/shared/container';
import {WorkspaceFileStructure} from '@oniichan/shared/dir';

interface Dependency {
    [WorkspaceFileStructure.containerKey]: WorkspaceFileStructure;
}

export class OmdCompletion implements CompletionItemProvider, Disposable {
    private readonly provider: Disposable;

    private readonly structure: WorkspaceFileStructure;

    constructor(container: DependencyContainer<Dependency>) {
        this.structure = container.get(WorkspaceFileStructure);
        this.provider = languages.registerCompletionItemProvider([{pattern: '**/*.omd'}], this, '#');
    }

    provideCompletionItems(document: TextDocument, position: Position): ProviderResult<CompletionItem[]> {
        const line = document.lineAt(position);
        const characterBeforeCursor = line.text[position.character - 1];

        if (characterBeforeCursor === '#') {
            const files = this.structure.toArray().filter(v => !v.endsWith('/'));
            return files.map(v => ({label: v, kind: CompletionItemKind.File}));
        }

        return [];
    }

    dispose() {
        this.provider.dispose();
    }
}
