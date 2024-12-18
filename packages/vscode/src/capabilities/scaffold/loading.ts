import {CodeLens, CodeLensProvider, Disposable, ProviderResult, Range, TextDocument} from 'vscode';

export class ScaffoldLoadingCodeLensProvider implements CodeLensProvider {
    static containerKey = 'ScaffoldLoadingCodeLensProvider' as const;

    private readonly documents = new Set<string>();

    provideCodeLenses(document: TextDocument): ProviderResult<CodeLens[]> {
        if (this.documents.has(document.uri.toString())) {
            return [
                new CodeLens(
                    new Range(0, 0, 0, 0),
                    {
                        title: 'Oniichan正在为你生成脚手架，请不要操作或关闭文件',
                        command: '',
                    }
                ),
            ];
        }
    }

    showLoading(documentUri: string) {
        this.documents.add(documentUri);
        return new Disposable(() => this.documents.delete(documentUri));
    }
}
