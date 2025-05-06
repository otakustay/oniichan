import type {FixtureMatcher, FixtureMatchResult, BaseMatcherConfig} from './interface';

interface GitDiffFile {
    type: 'modify' | 'add' | 'delete' | 'rename' | 'unknown';
    path: string;
    score: number;
}

export interface GitDiffMatcherConfig extends BaseMatcherConfig {
    type: 'git';
    files: GitDiffFile[];
}

export class GitDiffMatcher implements FixtureMatcher {
    private readonly cwd: string;

    private readonly config: GitDiffMatcherConfig;

    constructor(cwd: string, config: GitDiffMatcherConfig) {
        this.cwd = cwd;
        this.config = config;
    }

    async runMatch(): Promise<FixtureMatchResult> {
        const {execa} = await import('execa');
        await execa('git', ['add', '.'], {cwd: this.cwd});

        const result: FixtureMatchResult = {
            totalScore: 0,
            score: 0,
            items: [],
        };
        const files = await this.getDiffStatus();
        for (const target of this.config.files) {
            result.totalScore += target.score;
            const actual = files.find(v => v.path === target.path);
            const pass = actual?.type === target.type;
            result.score += pass ? target.score : 0;
            result.items.push({pass, description: `${target.type} ${target.path}`});
        }
        return result;
    }

    private async getDiffStatus() {
        const {execa} = await import('execa');
        const {stdout: text} = await execa('git', ['status', '--short'], {cwd: this.cwd});
        const files: GitDiffFile[] = [];
        for (const line of text.trim().split('\n')) {
            const status = line.charAt(0);
            const path = line.slice(3);
            files.push({type: this.shortStatusToDiffType(status), path, score: 0});
        }
        return files;
    }

    private shortStatusToDiffType(status: string): GitDiffFile['type'] {
        switch (status) {
            case 'M':
                return 'modify';
            case 'A':
                return 'add';
            case 'D':
                return 'delete';
            case 'R':
                return 'rename';
            default:
                return 'unknown';
        }
    }
}
