import type {FixtureQueryConfig, FixtureConfig} from './interface';

export type {FixtureQueryConfig, FixtureConfig};

export const fixtures: FixtureConfig[] = [
    {
        name: 'async-iterator-delete-debounce',
        source: {
            type: 'github',
            repo: 'git@github.com:otakustay/async-iterator.git',
            commit: '23c3e059befa6167ae4a18b9f29925f82aea2001',
        },
        query: {
            text: '删除debounce函数',
        },
    },
];
