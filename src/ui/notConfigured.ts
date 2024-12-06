import {commands, InputBoxOptions, window} from 'vscode';
import {updateApiKey} from '../utils/config';

interface NotConfiguredAction {
    title: string;
    action: 'go-to-settings' | 'input-api-key';
}

export async function notifyNotConfgured() {
    const result = await window.showWarningMessage<NotConfiguredAction>(
        '在你配置模型的API Key之前，欧尼酱可没法干活哦，还请去配置里填写相关信息。',
        {
            title: '输入API Key',
            action: 'input-api-key',
        },
        {
            title: '前往配置',
            action: 'go-to-settings',
        }
    );

    if (!result) {
        return false;
    }

    if (result.action === 'go-to-settings') {
        await commands.executeCommand('workbench.action.openSettings', `oniichan.model`);
        return false;
    }

    const options: InputBoxOptions = {
        password: true,
        prompt: '在这里输入你的Claude API Key，提交后任务会重新执行',
        placeHolder: 'fk**...',
    };
    const apiKey = await window.showInputBox(options);

    if (apiKey) {
        await updateApiKey(apiKey);
    }

    return !!apiKey;
}
