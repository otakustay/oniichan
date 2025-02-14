import {commands, InputBoxOptions, window, workspace} from 'vscode';
import {ModelConfiguration} from '@oniichan/shared/model';
import {getModelConfig} from '../../utils/config';
import {RequestHandler} from './handler';

interface NotConfiguredAction {
    title: string;
    action: 'go-to-settings' | 'configure-now';
}

async function updateModelConfiguration(input: ModelConfiguration) {
    const config = workspace.getConfiguration('oniichan.model');
    const update = async (key: keyof ModelConfiguration) => {
        const value = input[key];
        if (value) {
            await config.update(key, value, true);
        }
    };
    await Promise.all([update('apiKey'), update('modelName')]);
}

export class GetModelConfigHandler extends RequestHandler<string, ModelConfiguration> {
    static readonly action = 'getModelConfig';

    async *handleRequest(): AsyncIterable<ModelConfiguration> {
        const {logger} = this.context;
        logger.info('Start');

        const config = getModelConfig();
        yield config;

        logger.info('Finish');
    }
}

export class RequestModelConfigureHandler extends RequestHandler<void, void> {
    static readonly action = 'requestModelConfigure';

    // eslint-disable-next-line require-yield
    async *handleRequest() {
        const {logger} = this.context;
        logger.info('Start');

        const result = await window.showWarningMessage<NotConfiguredAction>(
            '在你配置好模型服务前，欧尼酱可没法干活哦，还请去配置里填写相关信息。',
            {
                title: '立即配置',
                action: 'configure-now',
            },
            {
                title: '前往设置页面',
                action: 'go-to-settings',
            }
        );

        if (!result) {
            return false;
        }

        if (result.action === 'go-to-settings') {
            logger.trace('OpenSetting');
            await commands.executeCommand('workbench.action.openSettings', `oniichan.model`);
            return false;
        }
        logger.trace('QuickConfigure');
        await this.configureModel();

        logger.info('Finish');
    }

    private async configureModel() {
        const config = getModelConfig();
        const inputApiKey = async (): Promise<void> => {
            const options: InputBoxOptions = {
                password: true,
                prompt: 'Your OpenRouter API Key',
                value: config.apiKey,
                placeHolder: 'sk-or-v1-**...',
                validateInput: value => {
                    if (!value.trim()) {
                        return '请输入API Key';
                    }
                },
            };
            const apiKey = await window.showInputBox(options);
            config.apiKey = apiKey?.trim() ?? '';
        };
        const inputModelName = async () => {
            const options = [
                'anthropic/claude-3.5-sonnet',
                'deepseek/deepseek-chat',
                'openai/chatgpt-4o-latest',
            ];
            const modelName = await window.showQuickPick(
                options,
                {
                    placeHolder: 'Select a model, we recommend anthropic/claude-3.5-sonnet',
                }
            );
            config.modelName = modelName ?? '';
        };

        await inputApiKey();
        await inputModelName();

        await updateModelConfiguration(config);
    }
}
