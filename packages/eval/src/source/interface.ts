export interface FixtureSource {
    fetch(fixtureName: string, parentDirectory: string): Promise<string>;
}
