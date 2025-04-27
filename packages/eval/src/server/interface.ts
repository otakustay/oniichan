import type {Logger} from '@oniichan/shared/logger';

export interface EvalConfig {
    apiKey: string;
    defaultModel: string;
    plannerModel: string;
    actorModel: string;
    coderModel: string;
    evalDirectory: string;
    reportFile: string;
}

export interface Context {
    cwd: string;
    logger: Logger;
    config: EvalConfig;
}
