import type {FixtureConfig} from '../interface';

const fixture: FixtureConfig = {
    name: 'async-iterator-delete-debounce',
    source: {
        type: 'github',
        repo: 'git@github.com:otakustay/async-iterator.git',
        commit: '23c3e059befa6167ae4a18b9f29925f82aea2001',
    },
    setup: [
        ['npm', 'install'],
    ],
    query: {
        text: '删除debounce函数',
    },
    tests: [
        {
            name: 'git-diff',
            minScore: 10,
            type: 'git',
            files: [
                {type: 'delete', path: 'src/helper/operators/debounce.ts', score: 5},
                {type: 'delete', path: 'src/helper/operators/__tests__/debounce.test.ts', score: 5},
                {type: 'modify', path: 'src/helper/index.ts', score: 1},
                {type: 'modify', path: 'src/helper/__tests__/index.test.ts', score: 1},
                {type: 'modify', path: 'README.md', score: 1},
            ],
        },
    ],
};

export default fixture;
