import {ConfigurationTarget, workspace} from 'vscode';

export function deleteConfiguration(section: string) {
    const configuration = workspace.getConfiguration();

    if (!configuration.has(section)) {
        return;
    }

    configuration.update(section, undefined, ConfigurationTarget.Global);
}
