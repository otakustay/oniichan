export interface GitDiffFile {
    type: 'modify' | 'add' | 'delete' | 'rename' | 'unknown';
    path: string;
    score: number;
}

interface BaseMatcherConfig {
    name: string;
    minScore: number;
}

export interface GitDiffMatcherConfig extends BaseMatcherConfig {
    type: 'git';
    files: GitDiffFile[];
}

export type FixtureMatcherConfig = GitDiffMatcherConfig;

export interface FixtureMatcherItem {
    pass: boolean;
    description: string;
}

export interface FixtureMatchResult {
    score: number;
    totalScore: number;
    items: FixtureMatcherItem[];
}

export interface FixtureMatcher {
    runMatch(): Promise<FixtureMatchResult>;
}
