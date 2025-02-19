import {atom, useAtomValue} from 'jotai';

export const workspaceFilesAtom = atom<string[]>([]);

export function useSearchWorkspaceFiles() {
    const files = useAtomValue(workspaceFilesAtom);
    return async (pattern: string) => {
        if (!pattern.trim()) {
            return [];
        }

        console.log(pattern);
        const {default: Fuse} = await import('fuse.js');
        const fuse = new Fuse(files);
        return fuse.search(pattern, {limit: 10}).map(v => v.item);
    };
}
