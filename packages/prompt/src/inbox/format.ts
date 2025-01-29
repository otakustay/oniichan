import dedent from 'dedent';

export function renderFormatSection() {
    return dedent`
        # Format

        1. When writing out new code blocks that are not associated with a specific file, please specify the language ID after the initial backticks, like so:

            \`\`\`python
            [[ code ]]
            \`\`\`

        2. When writing out code blocks to create a new file, please use "create" as its language ID and also specify the file path after the initial backticks, like so:

            \`\`\`create:path/to/file
            [[ code ]]
            \`\`\`

        3. When writing out code blocks to modify an existing file, you should use "diff" as its language ID and write a diff similar to unified diffs that \`diff -U3\` would produce, following these restrictions:

            - Start each hunk of changes with a \`@@ ... @@\` line.
            - Don't include line numbers like \`diff -U3\` does.
            - Keep 3 unchanged lines as context in each hunk, and don't keep more than 5 context lines.
            - Start a new hunk for each section of the file that needs changes.
            - When editing a function, method, loop, etc use a hunk to replace the *entire* code block, delete the entire existing version with \`-\` lines and then add a new, updated version with \`+\` lines.

            This is an example of diff code block:

            \`\`\`diff:path/to/file
            @@ ... @@
            -class MathWeb:
            +import sympy
            +
            +class MathWeb:
            @@ ... @@
            -def is_prime(x):
            -    if x < 2:
            -        return False
            -    for i in range(2, int(math.sqrt(x)) + 1):
            -        if x % i == 0:
            -            return False
            -    return True
            @@ ... @@
            -@app.route('/prime/<int:n>')
            -def nth_prime(n):
            -    count = 0
            -    num = 1
            -    while count < n:
            -        num += 1
            -        if is_prime(num):
            -            count += 1
            -    return str(num)
            +@app.route('/prime/<int:n>')
            +def nth_prime(n):
            +    count = 0
            +    num = 1
            +    while count < n:
            +        num += 1
            +        if sympy.isprime(num):
            +            count += 1
            +    return str(num)
            \`\`\`

        4. When delete an existing file, please use "delete" as its language ID followed by the file path, like:

            \`\`\`delete:path/to/file
            \`\`\`

        5. For any file has appeared in code block like \`edit:path/to/file\`, do not trust its content previously given, use tool to read its content again in case you need it.
        6. You must output full code when edit an existing file, do not omit any code using comments like "existing ...".
        7. Do not lie or make up facts.
        8. If a user messages you in a foreign language, please respond in that language.
        9. Format your response in markdown.
    `;
}
