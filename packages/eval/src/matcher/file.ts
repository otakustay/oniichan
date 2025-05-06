import {readFile, access} from 'fs/promises';
import type {FixtureMatcher, FixtureMatchResult, BaseMatcherConfig} from './interface';

interface FileMatchItem {
    path: string;
    includes: string[];
    score: number;
}

export interface FileMatcherConfig extends BaseMatcherConfig {
    type: 'file';
    files: FileMatchItem[];
}

export class FileMatcher implements FixtureMatcher {
    private readonly cwd: string;

    private readonly config: FileMatcherConfig;

    constructor(cwd: string, config: FileMatcherConfig) {
        this.cwd = cwd;
        this.config = config;
    }

    async runMatch(): Promise<FixtureMatchResult> {
        const result: FixtureMatchResult = {
            totalScore: 0,
            score: 0,
            items: [],
        };

        const checks = await Promise.all(this.config.files.map(v => this.checkFile(v)));

        for (const {target, pass} of checks) {
            result.totalScore += target.score;
            result.score += pass ? target.score : 0;
            result.items.push({pass, description: target.path});
        }

        return result;
    }

    private async checkFile(target: FileMatchItem) {
        const absolute = `${this.cwd}/${target.path}`;
        try {
            await access(absolute);
            const content = await readFile(absolute, 'utf-8');
            return {target, pass: target.includes.every(include => content.includes(include))};
        }
        catch {
            return {target, pass: false};
        }
    }
}
