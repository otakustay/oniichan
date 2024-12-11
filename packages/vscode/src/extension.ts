import {ExtensionContext} from 'vscode';
import {SemanticRewriteCommand} from './capabilities/semanticRewrite';
import {OpenDataFolderCommand} from './capabilities/debug';
import {WebApp} from './capabilities/web';
import {createKernelClient} from './kernel';

export async function activate(context: ExtensionContext) {
    const kernel = await createKernelClient();

    context.subscriptions.push(
        new SemanticRewriteCommand(kernel),
        new OpenDataFolderCommand(),
        new WebApp(context)
    );
}

export function deactivate() {
}
