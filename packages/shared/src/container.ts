export interface BindOptions {
    singleton: boolean;
}

type BaseMap<M> = Record<keyof M, unknown>;

type Keyable<T extends string> = T | {containerKey: T};

type Get<M extends BaseMap<M>> = <K extends Extract<keyof M, string>>(key: Keyable<K>) => M[K];

type Factory<M extends BaseMap<M>, T> = (get: Get<M>) => T;

interface SingletonState {
    value: unknown;
    initialized: boolean;
}

function singleton(factory: Factory<BaseMap<unknown>, unknown>, get: Get<BaseMap<unknown>>) {
    const state: SingletonState = {
        value: undefined,
        initialized: false,
    };

    return () => {
        if (!state.initialized) {
            state.value = factory(get);
            state.initialized = true;
        }

        return state.value;
    };
}

function multiton(factory: Factory<BaseMap<unknown>, unknown>, get: Get<BaseMap<unknown>>) {
    return () => factory(get);
}

type Bindings = Record<string, (() => any) | undefined>;

export class DependencyContainer<M extends BaseMap<M> = Record<string, never>> {
    private readonly bindings: Bindings;

    constructor(parent?: Bindings) {
        this.bindings = parent ?? {};
    }

    get<K extends Extract<keyof M, string>>(key: Keyable<K>) {
        const containerKey = typeof key === 'string' ? key : key.containerKey;
        const getValue = this.bindings[containerKey];

        if (!getValue) {
            throw new Error(`No binding found for ${containerKey}`);
        }

        const value: M[K] = getValue();
        return value;
    }
    bind<K extends string, T>(key: Keyable<K>, factory: () => T, options?: BindOptions) {
        const containerKey = typeof key === 'string' ? key : key.containerKey;
        const get: Get<M> = key => this.get(key);
        const nextBindings: Bindings = {
            ...this.bindings,
            [containerKey]: options?.singleton ? singleton(factory, get) : multiton(factory, get),
        };
        const next = new DependencyContainer<M & Record<K, T>>(nextBindings);
        return next;
    }
}

export class LazyContainer<T> {
    private readonly factory: () => Promise<T>;

    private value: T | null = null;

    constructor(factory: () => Promise<T>) {
        this.factory = factory;
    }

    async getInstance() {
        this.value ??= await this.factory();

        return this.value;
    }
}
