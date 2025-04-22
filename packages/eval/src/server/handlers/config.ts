import type {InboxConfig} from '@oniichan/editor-host/protocol';
import type {ModelConfiguration} from '@oniichan/shared/model';
import {RequestHandler} from './handler';

export class GetModelConfigHandler extends RequestHandler<string, ModelConfiguration> {
    static readonly action = 'getModelConfig';

    async *handleRequest(): AsyncIterable<ModelConfiguration> {
        const {config} = this.context;

        if (!config.apiKey) {
            throw new Error('API key is not configured');
        }
        if (!config.defaultModel) {
            throw new Error('Default model is not configured');
        }

        yield {
            apiKey: config.apiKey,
            modelName: config.defaultModel,
        };
    }
}

export class GetInboxConfigHandler extends RequestHandler<void, InboxConfig> {
    static readonly action = 'getInboxConfig';

    async *handleRequest(): AsyncIterable<InboxConfig> {
        const {config} = this.context;

        if (!config.plannerModel) {
            throw new Error('Planner model is not configured');
        }
        if (!config.actorModel) {
            throw new Error('Actor model is not configured');
        }
        if (!config.coderModel) {
            throw new Error('Coder model is not configured');
        }

        const result: InboxConfig = {
            automaticRunCommand: true,
            exceptionCommandList: [],
            plannerModel: config.plannerModel,
            actorModel: config.actorModel,
            coderModel: config.coderModel,
        };
        yield result;
    }
}

export class RequestModelConfigureHandler extends RequestHandler<void, void> {
    static readonly action = 'checkEditAppliable';

    // eslint-disable-next-line require-yield
    async *handleRequest() {
        throw new Error('Not implemented');
    }
}
