import {commands, InputBoxOptions, QuickPickItem, window, workspace} from 'vscode';
import {RequestHandler} from '@otakustay/ipc';
import {ModelConfiguration, ModelApiStyle} from '@oniichan/shared/model';
import {getModelConfig} from '../../utils/config';
import {Context} from '../interface';

const DEFAULT_ANTHROPIC_BASE_URL = 'https://api.anthropic.com';

const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';

interface ApiStylePickItem extends QuickPickItem {
    label: ModelApiStyle;
}

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
    await Promise.all([update('apiStyle'), update('baseUrl'), update('apiKey'), update('modelName')]);
}

export class GetModelConfigHandler extends RequestHandler<string, ModelConfiguration, Context> {
    static action = 'getModelConfig' as const;

    async *handleRequest(): AsyncIterable<ModelConfiguration> {
        const config = getModelConfig();
        yield config;
    }
}

export class RequestModelConfigureHandler extends RequestHandler<void, void, Context> {
    static action = 'requestModelConfigure' as const;

    // eslint-disable-next-line require-yield
    async *handleRequest() {
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
            await commands.executeCommand('workbench.action.openSettings', `oniichan.model`);
            return false;
        }

        await this.configureModel();
    }

    private async configureModel() {
        const config = getModelConfig();
        const inputApiStyle = async () => {
            const apiStyle = await window.showQuickPick<ApiStylePickItem>(
                [
                    {
                        label: 'Anthropic',
                        description: 'Anthropic风格的API服务，如Claude',
                    },
                    {
                        label: 'OpenAI',
                        description: 'OpenAI风格的API服务，如ChatGPT、OpenRouter等',
                    },
                ],
                {
                    title: '选择一种API风格',
                    placeHolder: '仅代表API风格，如OpenRouter是OpenAI风格，但依然可以使用Claude模型',
                    matchOnDescription: true,
                }
            );

            if (apiStyle) {
                config.apiStyle = apiStyle.label;
            }
        };
        const inputBaseUrl = async () => {
            const predictedDefaultValue = config.apiStyle === 'Anthropic'
                ? DEFAULT_ANTHROPIC_BASE_URL
                : DEFAULT_OPENAI_BASE_URL;
            const options: InputBoxOptions = {
                prompt: '如果你使用第三方的模型服务（OpenRouter、API2D等），请输入服务的入口地址',
                value: config.baseUrl || predictedDefaultValue,
                placeHolder: 'https://...',
                validateInput: value => {
                    if (!/^https?:\/\//.test(value)) {
                        return '请输入以完整的HTTP URL作为模型服务地址';
                    }
                },
            };
            const baseUrl = await window.showInputBox(options);
            config.baseUrl = baseUrl ?? '';
        };
        const inputApiKey = async (): Promise<void> => {
            const predictedDefaultValue = config.baseUrl === DEFAULT_ANTHROPIC_BASE_URL
                ? 'fk**...'
                : (config.baseUrl === DEFAULT_OPENAI_BASE_URL ? 'sk-...' : '');
            const options: InputBoxOptions = {
                password: true,
                prompt: '在这里输入你的模型服务商的API Key',
                value: config.apiKey,
                placeHolder: config.baseUrl || predictedDefaultValue,
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
            const predictedDefaultValue = config.baseUrl === DEFAULT_ANTHROPIC_BASE_URL
                ? 'claude-3-5-sonnet-latest'
                : (config.baseUrl === DEFAULT_OPENAI_BASE_URL ? 'gpt-4o' : '');
            const options: InputBoxOptions = {
                prompt: '输入模型名称，推荐使用claude-3-5-sonnet-latest模型',
                value: config.modelName || predictedDefaultValue,
                placeHolder: 'claude-3-5-sonnet-latest',
            };
            const modelName = await window.showInputBox(options);
            config.modelName = modelName ?? '';
        };

        // The later input relies on a previous one to update `config` object, don't change the order or use `Promise.all`
        await inputApiStyle();
        await inputBaseUrl();
        await inputApiKey();
        await inputModelName();

        await updateModelConfiguration(config);
    }
}
