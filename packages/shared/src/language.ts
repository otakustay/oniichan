interface LanguageConfigSource {
    comment: string[];
    keywords: string[];
}

class LanguageConfig {
    readonly language: string;

    private readonly commentSymbols: string[];

    private readonly keywords: Set<string>;

    constructor(language: string, config: LanguageConfigSource) {
        this.language = language;
        this.commentSymbols = config.comment;
        this.keywords = new Set(config.keywords);
    }

    isComment(line: string): boolean {
        const trimmedLine = line.trim();
        return this.commentSymbols.some(v => trimmedLine.startsWith(v));
    }

    endsWithIdentifier(line: string) {
        return /[a-zA-Z0-9_]\s*$/.test(line);
    }

    includesKeywordOnly(line: string) {
        const tokens = line.split(/[^a-zA-Z0-9_]+/g);
        return tokens.every(token => !token || this.keywords.has(token));
    }
}

const JS_KEYWORDS = [
    'break',
    'case',
    'catch',
    'class',
    'const',
    'continue',
    'debugger',
    'default',
    'delete',
    'do',
    'else',
    'export',
    'extends',
    'finally',
    'for',
    'function',
    'if',
    'import',
    'in',
    'instanceof',
    'new',
    'return',
    'super',
    'switch',
    'this',
    'throw',
    'try',
    'typeof',
    'var',
    'void',
    'while',
    'with',
    'yield',
    'enum',
    'implements',
    'interface',
    'let',
    'package',
    'private',
    'protected',
    'public',
    'static',
    'await',
    'abstract',
    'boolean',
    'goto',
];

const languages: Record<string, LanguageConfig | undefined> = {
    javascript: new LanguageConfig(
        'javascript',
        {
            comment: ['//'],
            keywords: JS_KEYWORDS,
        }
    ),
    typescript: new LanguageConfig(
        'typescript',
        {
            comment: ['//'],
            keywords: [
                ...JS_KEYWORDS,
                'any',
                'unknown',
                'never',
                'void',
                'as',
                'is',
                'keyof',
                'readonly',
                'declare',
                'type',
                'namespace',
                'module',
                'declare',
                'satisfie',
            ],
        }
    ),
};

const empty = new LanguageConfig('empty', {comment: [], keywords: []});

export function getLanguageConfig(language: string): LanguageConfig {
    return languages[language] ?? empty;
}
