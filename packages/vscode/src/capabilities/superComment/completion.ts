import {
    commands,
    CompletionItem,
    CompletionItemKind,
    CompletionItemProvider,
    DocumentSymbol,
    Position,
    Range,
    SymbolKind,
    TextDocument,
} from 'vscode';
import {getLanguageConfig} from '@oniichan/shared/language';

function mapKind(kind: SymbolKind): CompletionItemKind {
    switch (kind) {
        case SymbolKind.File:
        case SymbolKind.Module:
        case SymbolKind.Namespace:
        case SymbolKind.Package:
            return CompletionItemKind.Reference;
        case SymbolKind.Class:
            return CompletionItemKind.Class;
        case SymbolKind.Method:
            return CompletionItemKind.Method;
        case SymbolKind.Property:
            return CompletionItemKind.Field;
        case SymbolKind.Field:
            return CompletionItemKind.Field;
        case SymbolKind.Constructor:
            return CompletionItemKind.Constructor;
        case SymbolKind.Enum:
            return CompletionItemKind.Enum;
        case SymbolKind.Interface:
            return CompletionItemKind.Interface;
        case SymbolKind.Function:
            return CompletionItemKind.Function;
        case SymbolKind.Variable:
            return CompletionItemKind.Variable;
        case SymbolKind.Constant:
            return CompletionItemKind.Constant;
        case SymbolKind.String:
        case SymbolKind.Number:
        case SymbolKind.Boolean:
        case SymbolKind.Array:
        case SymbolKind.Object:
            return CompletionItemKind.Value;
        case SymbolKind.Key:
            return CompletionItemKind.Property;
        case SymbolKind.Null:
            return CompletionItemKind.Unit;
        case SymbolKind.EnumMember:
            return CompletionItemKind.EnumMember;
        case SymbolKind.Struct:
            return CompletionItemKind.Struct;
        case SymbolKind.Event:
            return CompletionItemKind.Event;
        case SymbolKind.Operator:
            return CompletionItemKind.Operator;
        case SymbolKind.TypeParameter:
            return CompletionItemKind.TypeParameter;
        default:
            return CompletionItemKind.Field;
    }
}

export class SuperCommentCompletionProvider implements CompletionItemProvider {
    async provideCompletionItems(document: TextDocument, position: Position) {
        const languageConfig = getLanguageConfig(document.languageId);
        const line = document.lineAt(position);
        const characterBeforeCursor = line.text[position.character - 1];

        if (languageConfig.isComment(line.text) && characterBeforeCursor === '`') {
            try {
                const symbols = await commands.executeCommand<DocumentSymbol[]>(
                    'vscode.executeDocumentSymbolProvider',
                    document.uri
                );
                const toCompletionItem = (symbol: DocumentSymbol): CompletionItem => {
                    const item = new CompletionItem('`' + symbol.name + '`', mapKind(symbol.kind));
                    item.range = new Range(
                        new Position(position.line, position.character - 1),
                        new Position(position.line, position.character)
                    );
                    return item;
                };
                return symbols.map(toCompletionItem);
            }
            catch {
                return [];
            }
        }

        return [];
    }

    resolveCompletionItem(item: CompletionItem) {
        return item;
    }
}
