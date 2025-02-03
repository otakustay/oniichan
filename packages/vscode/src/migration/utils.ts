import {ConfigurationTarget, workspace} from 'vscode';

export function deleteConfiguration(section: string) {
    workspace.getConfiguration().update(section, undefined, ConfigurationTarget.Global);
    workspace.getConfiguration().update(section, undefined, ConfigurationTarget.Workspace);
    workspace.getConfiguration().update(section, undefined, ConfigurationTarget.WorkspaceFolder);
}
