export async function* toLines(iterable: AsyncIterable<string>): AsyncIterable<string> {
    const state = {buffer: ''};

    for await (const chunk of iterable) {
        state.buffer += chunk;
        const lines = state.buffer.split('\n');

        if (lines.length <= 1) {
            continue;
        }

        state.buffer = lines.pop() ?? '';

        for (const line of lines) {
            yield line;
        }
    }

    if (state.buffer) {
        yield state.buffer;
    }
}
