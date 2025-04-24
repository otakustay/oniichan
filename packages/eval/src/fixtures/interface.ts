import type {FixtureMatcherConfig} from '../matcher';
import type {EvalSourceConfig} from '../source';

export interface FixtureQueryConfig {
    text: string;
}

export interface FixtureConfig {
    name: string;
    source: EvalSourceConfig;
    query: FixtureQueryConfig;
    tests: FixtureMatcherConfig[];
}
