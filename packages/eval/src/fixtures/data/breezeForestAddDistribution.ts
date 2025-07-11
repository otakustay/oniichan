import type {FixtureConfig} from '../interface.js';

const fixture: FixtureConfig = {
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
};

export default fixture;
