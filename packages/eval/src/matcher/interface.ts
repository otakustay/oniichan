export interface BaseMatcherConfig {
    name: string;
    minScore: number;
}

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
