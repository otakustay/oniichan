import {atom, useAtomValue} from 'jotai';

export const workspaceFilesAtom = atom<string[]>([]);

export function useSearchWorkspaceFiles() {
    const files = useAtomValue(workspaceFilesAtom);
    return () => files;
}
