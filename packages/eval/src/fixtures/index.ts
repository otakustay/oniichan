import type {FixtureQueryConfig, FixtureConfig, ShellSetup} from './interface';

export type {FixtureQueryConfig, FixtureConfig, ShellSetup};

export const fixtures: FixtureConfig[] = [
    {
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
    },
    {
        name: 'breeze-forest-add-distribution',
        source: {
            type: 'zip',
            path: 'breeze-forest-add-distribution.zip',
        },
        setup: [
            {
                type: 'shell',
                script: [
                    'PYTHONPATH=. python3 -m venv .venv',
                    'source .venv/bin/activate',
                    'pip install -r requirements.txt',
                ],
            },
        ],
        query: {
            text:
                'Add a new 2d distribution named DIAMOND so that the pass score for tests in test_distributions.py is 1.0. to note that test_distributions.py could not be modified.',
        },
        tests: [
            {
                name: 'distribution-score',
                minScore: 1,
                type: 'shell',
                script: [
                    'unset PYTHONPATH',
                    'source .venv/bin/activate',
                    'PYTHONPATH=. gtimeout 3m python3 test_distributions.py',
                ],
                matches: [
                    {
                        text: 'score: 1.0',
                        score: 1,
                    },
                ],
            },
        ],
    },
];
