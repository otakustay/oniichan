import type {FixtureMatcher} from './interface.js';
import {GitDiffMatcher} from './gitDiff.js';
import type {GitDiffMatcherConfig} from './gitDiff.js';
import type {ShellMatcherConfig} from './shell.js';
import ShellMatcher from './shell.js';
import {FileMatcher} from './file.js';
import type {FileMatcherConfig} from './file.js';

export type {FixtureMatchResult, FixtureMatcherItem} from './interface.js';

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
