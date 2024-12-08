import {ExtensionContext} from 'vscode';
import {SemanticRewriteCommand} from './commands/semanticRewrite';
import {OpenDataFolderCommand} from './commands/debug';

export function activate(context: ExtensionContext) {
    context.subscriptions.push(
        new SemanticRewriteCommand(),
        new OpenDataFolderCommand()
    );
}

export function deactivate() {
}
