import path from 'node:path';
import url from 'node:url';
import fs from 'node:fs/promises';
import {globalConfigDirectory} from '@oniichan/shared/dir';
import {EditorHost} from '../editor';

export interface CustomConfig {
    embeddingRepoId: string;
    embeddingOnQuery: boolean;
    embeddingAsTool: boolean;
    embeddingContextMode: 'chunk' | 'fullContent' | 'nameOnly';
    minEmbeddingDistance: number;
    rootEntriesOnQuery: boolean;
}

async function readConfig(directory: string): Promise<Partial<CustomConfig>> {
    try {
        const config = await fs.readFile(path.join(directory, 'config.json'), 'utf-8');
        return JSON.parse(config) as Partial<CustomConfig>;
    }
    catch {
        return {};
    }
}

export async function readCustomConfig(editorHost: EditorHost): Promise<CustomConfig> {
    const globalDirectory = await globalConfigDirectory();
    const global = globalDirectory ? await readConfig(globalDirectory) : {};

    const root = await editorHost.getWorkspace().getRoot();
    const repo = root ? await readConfig(path.join(url.fileURLToPath(root), '.oniichan')) : {};

    const merged = {...global, ...repo};
    return {
        embeddingRepoId: merged.embeddingRepoId ?? '',
        embeddingOnQuery: merged.embeddingOnQuery ?? true,
        embeddingAsTool: merged.embeddingAsTool ?? false,
        embeddingContextMode: merged.embeddingContextMode ?? 'chunk',
        minEmbeddingDistance: merged.minEmbeddingDistance ?? 0,
        rootEntriesOnQuery: merged.rootEntriesOnQuery ?? false,
    };
}
