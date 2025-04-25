import type {FixtureMatcherConfig} from '../matcher';
import type {FixtureSourceConfig} from '../source';

export interface FixtureQueryConfig {
    text: string;
}

export interface ShellSetup {
    type: 'shell';
    script: string | string[];
}

export interface FixtureConfig {
    name: string;
    source: FixtureSourceConfig;
    setup?: Array<string | string[] | ShellSetup>;
    query: FixtureQueryConfig;
    tests: FixtureMatcherConfig[];
}
