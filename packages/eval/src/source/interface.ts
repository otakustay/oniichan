export interface GitHubEvalSourceConfig {
    type: 'github';
    repo: string;
    commit: string;
}

export type EvalSourceConfig = GitHubEvalSourceConfig;
