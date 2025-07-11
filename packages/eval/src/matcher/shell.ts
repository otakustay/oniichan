import {execa} from 'execa';
import type {BaseMatcherConfig, FixtureMatcher, FixtureMatchResult} from './interface.js';

interface ShellMatchItem {
    text: string;
    score: number;
}

export interface ShellMatcherConfig extends BaseMatcherConfig {
    type: 'shell';
    script: string | string[];
    matches: ShellMatchItem[];
}

export default class ShellMatcher implements FixtureMatcher {
    private readonly cwd: string;

    private readonly config: ShellMatcherConfig;

    constructor(cwd: string, config: ShellMatcherConfig) {
        this.cwd = cwd;
        this.config = config;
    }

    async runMatch(): Promise<FixtureMatchResult> {
        const script = Array.isArray(this.config.script) ? this.config.script.join('\n') : this.config.script;
        try {
            const {stdout} = await execa(script, {shell: true, cwd: this.cwd});
            const result: FixtureMatchResult = {
                totalScore: 0,
                score: 0,
                items: [],
            };
            for (const match of this.config.matches) {
                result.totalScore += match.score;
                const pass = stdout.includes(match.text);
                result.items.push({pass, description: this.itemLabel(match)});
                if (pass) {
                    result.score += match.score;
                }
            }
            return result;
        }
        catch {
            return {
                totalScore: this.config.matches.reduce((s, v) => s + v.score, 0),
                score: 0,
                items: this.config.matches.map(v => ({pass: false, description: this.itemLabel(v)})),
            };
        }
    }

    private itemLabel(item: ShellMatchItem): string {
        return item.text.length > 40 ? `${item.text.slice(0, 40)}...` : item.text;
    }
}
