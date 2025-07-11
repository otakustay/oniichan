import type {FixtureSource} from './interface.js';
import {GitHubFixtureSource} from './github.js';
import type {GitHubFixtureSourceConfig} from './github.js';
import {ZipFixtureSource} from './zip.js';
import type {ZipFixtureSourceConfig} from './zip.js';

export type FixtureSourceConfig = GitHubFixtureSourceConfig | ZipFixtureSourceConfig;

export function createFixtureSource(source: FixtureSourceConfig): FixtureSource {
    switch (source.type) {
        case 'github':
            return new GitHubFixtureSource(source);
        case 'zip':
            return new ZipFixtureSource(source);
    }
}
