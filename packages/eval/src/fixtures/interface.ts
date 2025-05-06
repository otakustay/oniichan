import type {InboxMessageReference} from '@oniichan/kernel/protocol';
import type {FixtureMatcherConfig} from '../matcher';
import type {FixtureSourceConfig} from '../source';

export interface FixtureQueryConfig {
    text: string;
    references?: InboxMessageReference[];
}

export interface BinWhen {
    type: 'bin';
    command: string;
}

export type FixtureWhenConfig = BinWhen;

export interface ShellSetup {
    type: 'shell';
    script: string | string[];
}

export interface FixtureConfig {
    /** The name of fixture */
    name: string;
    /** Only run when conditions are all satisfied */
    when?: FixtureWhenConfig[];
    /** How to create the directory of fixture */
    source: FixtureSourceConfig;
    /** Run before evaluation */
    setup?: Array<string | string[] | ShellSetup>;
    /** The input query and references */
    query: FixtureQueryConfig;
    /** Test if the directory after evaluation is as expected */
    tests: FixtureMatcherConfig[];
}
