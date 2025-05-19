import dedent from 'dedent';
import type {ToolDescription} from '@oniichan/shared/tool';

const definitions = [
    {
        name: 'read_file',
        description: `Read the content of a file`,
        parameters: {
            type: 'object',
            properties: {
                path: {
                    type: 'array',
                    description: 'The paths to the files you want to read, must be a relative path',
                    items: {
                        type: 'string',
                    },
                    minItems: 1,
                },
            },
            required: ['path'],
        },
        usage: dedent`
            <read_file>
                <path>src/utils/index.ts</path>
            </read_file>
        `,
    },
    {
        name: 'read_directory',
        description: `Read the file and child directories in a directory, at most 2000 files will be returned`,
        parameters: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'The path to the directory you want to read, must be a relative path',
                },
                recursive: {
                    type: 'boolean',
                    description: 'Whether to recursively read the directory',
                },
            },
            required: ['path'],
        },
        usage: dedent`
            <read_directory>
                <path>src/utils</path>
                <recursive>true</recursive>
            </read_directory>
        `,
    },
    {
        name: 'find_files_by_glob',
        description: `Find files matching a glob pattern`,
        parameters: {
            type: 'object',
            properties: {
                glob: {
                    type: 'string',
                    description: 'The glob pattern to match files',
                },
            },
            required: ['glob'],
        },
        usage: dedent`
            <find_files_by_glob>
                <glob>src/common/**/*.{ts,tsx}</glob>
            </find_files_by_glob>
        `,
    },
    {
        name: 'find_files_by_regex',
        description: 'Find files matching a regular expression',
        parameters: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'The path to the directory you want to search for, must be a relative path',
                },
                regex: {
                    type: 'string',
                    description: 'A regular expression to match file content',
                },
                glob: {
                    type: 'string',
                    description:
                        'Glob pattern to match searched files, search for all text files when this parameter is not provided',
                },
            },
            required: ['path', 'regex'],
        },
        usage: dedent`
            <find_files_by_regex>
                <regex>export function [A-Z][a-zA-Z0-9]*\\(</regex>
                <path>src/common</path>
            </find_files_by_regex>
        `,
    },
    {
        name: 'write_file',
        description: `Write content to a file, creates the file if it does not exist`,
        parameters: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'The path to the file you want to write, must be a relative path',
                },
                content: {
                    type: 'string',
                    description:
                        'The full content of the file, DO NOT lose anything in content, DO NOT use comments like "// existing..." to omit content',
                },
            },
            required: ['path', 'content'],
        },
        usage: dedent`
            <write_file>
                <path>src/greeting.ts</path>
                <content>
                export function hello() {
                    return "hello";
                }
                </content></write_file>
        `,
    },
    {
        name: 'patch_file',
        description: 'Patch a file with one or more patch blocks in special format',
        parameters: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'The path to the file you want to patch, must be a relative path',
                },
                patch: {
                    type: 'array',
                    items: {
                        type: 'string',
                    },
                    minItems: 1,
                    description: dedent`
                    One or more patch blocks exactly in the format illustrated below:
                    \`\`\`
                    <<<<<<< SEARCH
                    [Exact content to search]
                    =======
                    [New content to replace with]
                    >>>>>>> REPLACE
                    \`\`\`
                    Rules for search and replace:
                    1. \`SEARCH\` content must exactly match what in original file, including whitespace, indentation and line endings.
                    2. Keep \`SEARCH\` part minimum, only include surrounding unmodified context lines if needed to locate content uniquely.
                    3. Use multiple patch blocks if multiple parts of the file need to be modified.
                    4. Use small patch blocks, split into multiple blocks if one includes unchanged lines in the middle.
                    5. To move code, use two patch blocks, one to delete the original code and another to add it in a new location.
                    6. To delete code, use a patch block with \`REPLACE\` part empty.
                `,
                },
            },
            required: ['path', 'patch'],
        },
        usage: dedent`
            <patch_file>
                <path>src/utils/index.ts</path>
                <patch>
                <<<<<<< SEARCH
                @media (prefers-color-scheme: light) {
                    color: #000;
                =======
                @media (prefers-color-scheme: dark) {
                    color: #fff;
                >>>>>>> REPLACE
                </patch>
            </patch_file>
        `,
    },
    {
        name: 'delete_file',
        description: 'Delete a file from the workspace',
        parameters: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'The path to the file you want to delete, must be a relative path',
                },
            },
            required: ['path'],
        },
        usage: dedent`
            <delete_file>
                <path>src/old-file.ts</path>
            </delete_file>
        `,
    },
    {
        name: 'browser_preview',
        description:
            'Open a URL in browser to preview current application, be sure the URL is accessible before using this tool',
        parameters: {
            type: 'object',
            properties: {
                url: {
                    type: 'string',
                    description: 'The URL to open in the browser preview window',
                },
            },
            required: ['url'],
        },
        usage: dedent`
            <browser_preview>
                <url>https://example.com</url>
            </browser_preview>
        `,
    },
    {
        name: 'run_command',
        description:
            `Execute a CLI command on the system. To operate with system and perform tasks that are not covered by other tools, use this tool with a clear explanation of what the command does.`,
        parameters: {
            type: 'object',
            properties: {
                command: {
                    type: 'string',
                    description: 'The command to run, must be a valid shell command',
                },
            },
            required: ['command'],
        },
        usage: dedent`
            <run_command>
                <command>ls -la</command>
            </run_command>
        `,
    },
    {
        name: 'ask_followup_question',
        description:
            'Ask the user a question to gather additional information needed to complete the task. This tool should be used when you encounter ambiguities, need clarification, or require more details to proceed effectively. It allows for interactive problem-solving by enabling direct communication with the user. Use this tool judiciously to maintain a balance between gathering necessary information and avoiding excessive back-and-forth',
        parameters: {
            type: 'object',
            properties: {
                question: {
                    type: 'string',
                    description:
                        'The question to ask the user. This should be a clear, specific question that addresses the information you need',
                },
            },
            required: ['question'],
        },
        usage: dedent`
            <ask_followup_question>
                <question>Your question</question>
            </ask_followup_question>
        `,
    },
    {
        name: 'attempt_completion',
        description:
            'When you confirm the user request is completed, use this tool to present the result of your work to the user, it\'s better to also have an instruction about how to verify the result. Optionally you may provide a CLI command to showcase the result of your work.',
        parameters: {
            type: 'object',
            properties: {
                result: {
                    type: 'string',
                    description: 'Your final result to user\'s request',
                },
                command: {
                    type: 'string',
                    description: 'Command to demonstrate result',
                },
            },
            required: ['result'],
        },
        usage: dedent`
            <attempt_completion>
                <r>The result of your completion</r>
                <command>The command you used to demonstrate the result</command>
            </attempt_completion>
        `,
    },
] as const satisfies ToolDescription[];
const sharedTools = new Map(definitions.map(v => [v.name, v]));

export type SharedToolName = typeof definitions[number]['name'];

export function pickSharedTools(...names: SharedToolName[]): ToolDescription[] {
    return names.map(v => sharedTools.get(v)).filter(v => !!v);
}
