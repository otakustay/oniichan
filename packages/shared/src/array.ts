export interface UpdateArrayItemOptions<T, I extends T> {
    find: (item: T) => item is I;
    create: () => I;
    update: (current: I) => I;
    moveToTop?: boolean;
}

export function updateItemInArray<T, I extends T>(array: T[], options: UpdateArrayItemOptions<T, I>) {
    const index = array.findIndex(options.find);

    if (index < 0) {
        const newItem = options.create();
        return options.moveToTop ? [newItem, ...array] : [...array, newItem];
    }

    const current = array[index] as I;
    const updated = options.update(current);

    return options.moveToTop
        ? [updated, ...array.slice(0, index), ...array.slice(index + 1)]
        : [...array.slice(0, index), updated, ...array.slice(index + 1)];
}

export function sortedInsert<T>(array: T[], item: T, compare: (x: T, y: T) => number): void {
    const index = array.findIndex(i => compare(item, i) < 0);
    array.splice(index < 0 ? array.length : index, 0, item);
}

export function uniqueBy<T>(array: T[], getKey: (item: T) => unknown): T[] {
    const seen = new Set<unknown>();
    const results: T[] = [];
    for (const item of array) {
        const key = getKey(item);
        if (!seen.has(key)) {
            results.push(item);
            seen.add(key);
        }
    }
    return results;
}
