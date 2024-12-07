interface LanguageConfig {
    comment: string[];
}

const languages: Record<string, LanguageConfig | undefined> = {
    javascript: {
        comment: ['//'],
    },
    typescript: {
        comment: ['//'],
    },
};

export function isComment(line: string, languageId: string): boolean {
    const config = languages[languageId];

    if (!config) {
        return false;
    }

    const trimmedLine = line.trim();
    return config.comment.some(commentSymbol => trimmedLine.startsWith(commentSymbol));
}
