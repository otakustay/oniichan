import {ExtensionContext} from 'vscode';
import {SemanticRewriteCommand} from './capabilities/semanticRewrite';
import {OpenDataFolderCommand} from './capabilities/debug';
import {WebApp} from './capabilities/web';

export function activate(context: ExtensionContext) {
    context.subscriptions.push(
        new SemanticRewriteCommand(),
        new OpenDataFolderCommand(),
        new WebApp(context)
    );
}

export function deactivate() {
}
