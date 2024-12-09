import {ExtensionContext} from 'vscode';
import {SemanticRewriteCommand} from './capabilities/semanticRewrite';
import {OpenDataFolderCommand} from './capabilities/debug';
import {WebAppServer} from './capabilities/server';

export function activate(context: ExtensionContext) {
    context.subscriptions.push(
        new SemanticRewriteCommand(),
        new OpenDataFolderCommand(),
        new WebAppServer()
    );
}

export function deactivate() {
}
