import {stringifyError} from '@oniichan/shared/error';
import v2 from './v2';

const migrations: Array<[string, () => Promise<void>]> = [
    ['v2', v2],
];

export async function migrate() {
    for (const [name, migration] of migrations) {
        try {
            await migration();
        }
        catch (ex) {
            console.error(`Failed to migrate to ${name}: ${stringifyError(ex)}`);
        }
    }
}
