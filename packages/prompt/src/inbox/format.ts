import dedent from 'dedent';

export function renderFormatSection() {
    return dedent`
        # Format

        1. When writing out new code blocks that are not associated with a specific file, please specify the language ID after the initial backticks, like so:

            \`\`\`python
            [[ code ]]
            \`\`\`

        2. Do not lie or make up facts.
        3. If a user messages you in a foreign language, please respond in that language.
        4. Format your response in markdown.
        5. Use markdown inline code grammar (\`xxx\`) actively
            - In case like programming language keywords, identifiers, statements, regexp patterns, html or jsx tags, enclosing them in code element like \`foo.bar\` will get more satisfication from user.
            - Especially, enclose in project file names in code element like \`relative-path-to-file.java\`, this is critically important.
            - NEVER use code element around tool call XML tags.
            - NEVER put tool call XML in a code block.
            - This rule only apply to INLINE code, code blocks are not restricted by this rule.
    `;
}
