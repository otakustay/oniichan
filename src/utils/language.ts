interface LanguageConfig {
    comment: string[];
}

const languages: Record<string, LanguageConfig | undefined> = {};

export function isComment(line: string, languageId: string): boolean {
    const config = languages[languageId];

    if (!config) {
        return false;
    }

    const trimmedLine = line.trim();
    return config.comment.some(commentSymbol => trimmedLine.startsWith(commentSymbol));
}
