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
        4. Format your response in markdown
        5. Never include a tool name outside of <thinking></thinking> tag in your response.
    `;
}
