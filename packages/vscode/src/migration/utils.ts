import {ConfigurationTarget, workspace} from 'vscode';

export function deleteConfiguration(section: string) {
    // TODO: Should be `undefined`
    workspace.getConfiguration().update(section, null, ConfigurationTarget.Global);
    workspace.getConfiguration().update(section, null, ConfigurationTarget.Workspace);
    workspace.getConfiguration().update(section, null, ConfigurationTarget.WorkspaceFolder);
}
