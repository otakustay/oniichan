import {atom, useAtomValue, getDefaultStore} from 'jotai';

interface ViewMode {
    debug: boolean;
}

const searchParams = new URLSearchParams(location.search);
const isInDebugMode = process.env.NODE_ENV === 'development' && !searchParams.has('production');
const viewModeAtom = atom<ViewMode>({debug: isInDebugMode});

export function useViewModeValue() {
    return useAtomValue(viewModeAtom);
}

// @ts-expect-error force expose debug function
window.debugView = (debug: boolean) => {
    const store = getDefaultStore();
    store.set(viewModeAtom, {debug});
};
