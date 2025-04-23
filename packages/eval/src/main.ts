import {fixtures} from './fixtures';
import {FixtureRunner} from './runner';

async function main() {
    for (const fixture of fixtures) {
        const runner = new FixtureRunner(fixture);
        await runner.run();
    }
}

void main();
