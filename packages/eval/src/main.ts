import {fixtures} from './fixtures';
import {FixtureRunner} from './runner';

async function main() {
    const only = fixtures.filter(v => v.name.includes('breeze-forest'));
    for (const fixture of only) {
        const runner = new FixtureRunner(fixture);
        await runner.run();
    }
}

void main();
