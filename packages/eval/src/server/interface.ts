import type {Logger} from '@oniichan/shared/logger';

export interface EvalConfig {
    apiKey: string;
    defaultModel: string;
    plannerModel: string;
    actorModel: string;
    coderModel: string;
}

export interface Context {
    cwd: string;
    logger: Logger;
    config: EvalConfig;
}
