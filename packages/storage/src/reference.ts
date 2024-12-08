interface ReferenceItem<T> {
    value: T;
    references: number;
}

export class ReferenceCount<T> {
    private readonly references = new Map<string, ReferenceItem<T>>();

    async get(key: string, create: () => Promise<T>): Promise<T> {
        const reference = this.references.get(key);

        if (reference) {
            reference.references++;
            return reference.value;
        }

        const value = await create();

        // To avoid race condition, test the existance again.
        const existed = this.references.get(key);

        if (existed) {
            existed.references++;
            return existed.value;
        }

        this.references.set(key, {value, references: 1});
        return value;
    }

    release(key: string) {
        const reference = this.references.get(key);

        if (!reference) {
            return;
        }

        reference.references--;

        if (reference.references <= 0) {
            this.references.delete(key);
        }
    }
}
