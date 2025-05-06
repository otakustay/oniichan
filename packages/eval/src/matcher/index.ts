import type {FixtureMatcher} from './interface';
import {GitDiffMatcher} from './gitDiff';
import type {GitDiffMatcherConfig} from './gitDiff';
import type {ShellMatcherConfig} from './shell';
import ShellMatcher from './shell';
import {FileMatcher} from './file';
import type {FileMatcherConfig} from './file';

export type {FixtureMatchResult, FixtureMatcherItem} from './interface';

export type FixtureMatcherConfig = GitDiffMatcherConfig | ShellMatcherConfig | FileMatcherConfig;

export function createFixtureMatcher(cwd: string, config: FixtureMatcherConfig): FixtureMatcher {
    switch (config.type) {
        case 'git':
            return new GitDiffMatcher(cwd, config);
        case 'shell':
            return new ShellMatcher(cwd, config);
        case 'file':
            return new FileMatcher(cwd, config);
    }
}
