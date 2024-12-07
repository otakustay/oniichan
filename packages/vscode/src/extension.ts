import {ExtensionContext} from 'vscode';
import {SemanticRewriteCommand} from './commands/semanticRewrite';

export function activate(context: ExtensionContext) {
    context.subscriptions.push(
        new SemanticRewriteCommand()
    );
}

export function deactivate() {
}
