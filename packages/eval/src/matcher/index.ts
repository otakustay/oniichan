import type {FixtureMatcher} from './interface';
import {GitDiffMatcher} from './gitDiff';
import type {GitDiffMatcherConfig} from './gitDiff';
import type {ShellMatcherConfig} from './shell';
import ShellMatcher from './shell';

export type {FixtureMatchResult, FixtureMatcherItem} from './interface';

export type FixtureMatcherConfig = GitDiffMatcherConfig | ShellMatcherConfig;

export function createFixtureMatcher(cwd: string, config: FixtureMatcherConfig): FixtureMatcher {
    switch (config.type) {
        case 'git':
            return new GitDiffMatcher(cwd, config);
        case 'shell':
            return new ShellMatcher(cwd, config);
    }
}
