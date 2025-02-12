export interface ParsedPatch {
    search: string[];
    replace: string[];
}

interface ParseState {
    context: 'none' | 'search' | 'replace';
    current: ParsedPatch | null;
}

export class PatchParseError extends Error {
}

export function parsePatchString(input: string): ParsedPatch[] {
    // A patch block looks like this:
    //
    // ```
    // <<<<<<< SEARCH
    // content to search
    // =======
    // content to replace
    // >>>>>>> REPLACE
    // ```
    //
    // For more stable parsing, we allow `<<<<`, `====` and `>>>>` to have different repetive length,
    // but it requires at least 4 in order not to be confused with the `<<`, `>>` or `===` operators
    const results: ParsedPatch[] = [];
    const state: ParseState = {context: 'none', current: null};

    for (const line of input.split('\n')) {
        if (/^<{4,}\s+SEARCH$/.test(line)) {
            if (state.current) {
                results.push(state.current);
            }

            state.context = 'search';
            state.current = {search: [], replace: []};
        }
        else if (/^={4,}$/.test(line)) {
            if (state.context === 'search') {
                state.context = 'replace';
            }
        }
        else if (/^>{4,}\s+REPLACE$/.test(line)) {
            if (state.context === 'replace') {
                state.context = 'none';
            }
        }
        else {
            if (state.context === 'search' && state.current) {
                state.current.search.push(line);
            }
            else if (state.context === 'replace' && state.current) {
                state.current.replace.push(line);
            }
        }
    }

    if (state.current) {
        results.push(state.current);
    }

    if (!results) {
        throw new PatchParseError('There is not patch blocks in patch string');
    }

    return results;
}
