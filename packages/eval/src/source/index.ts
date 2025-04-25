import type {FixtureSource} from './interface';
import {GitHubFixtureSource} from './github';
import type {GitHubFixtureSourceConfig} from './github';
import {ZipFixtureSource} from './zip';
import type {ZipFixtureSourceConfig} from './zip';

export type FixtureSourceConfig = GitHubFixtureSourceConfig | ZipFixtureSourceConfig;

export function createFixtureSource(source: FixtureSourceConfig): FixtureSource {
    switch (source.type) {
        case 'github':
            return new GitHubFixtureSource(source);
        case 'zip':
            return new ZipFixtureSource(source);
    }
}
