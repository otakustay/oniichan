import {MessageThreadPersistData} from '@oniichan/shared/inbox';
// TODO: Use IoC to manage store
import {ThreadStore} from '../../inbox';

const debugMessageThreadFixtures: MessageThreadPersistData[] = [
    {
        uuid: '60a63322-1d9c-492a-b40b-849c278f8a4a',
        roundtrips: [
            {
                status: 'read',
                request: {
                    uuid: '5b319240-e4d1-4d82-9c34-226e98ba7007',
                    createdAt: '2025-02-21T04:41:10.204Z',
                    type: 'userRequest',
                    content: '删除`chunk`这个运算符',
                },
                responses: [
                    {
                        type: 'debug',
                        message: {
                            uuid: '4ddc0f32-a6c4-453b-baac-0f52680df359',
                            createdAt: '2025-02-21T04:41:10.213Z',
                            type: 'debug',
                            level: 'info',
                            title: 'System Prompt',
                            content: {
                                type: 'plainText',
                                content:
                                    '# Rule\n\nYou are an intelligent programmer. You are happy to help answer any questions that the user has (usually they will be about coding).\n\n# Format\n\n1. When writing out new code blocks that are not associated with a specific file, please specify the language ID after the initial backticks, like so:\n\n    ```python\n    [[ code ]]\n    ```\n\n2. Do not lie or make up facts.\n3. If a user messages you in a foreign language, please respond in that language.\n4. Format your response in markdown.\n5. Use markdown inline code grammar (`xxx`) actively\n    - In case like programming language keywords, identifiers, statements, regexp patterns, html or jsx tags, enclosing them in code element like `foo.bar` will get more satisfication from user.\n    - Especially, enclose in project file names in code element like `relative-path-to-file.java`, this is critically important.\n    - NEVER use code element around tool call XML tags.\n    - NEVER put tool call XML in a code block.\n    - This rule only apply to INLINE code, code blocks are not restricted by this rule.\n6. Never include a tool name outside of <thinking></thinking> tag in your response.\n\n# Tool\n\nYou can use several tools handling user request, you can **only use one tool per message**, the result of tool use will be provided in the next message, each tool use informed by previous uses.\n\n## Tool Use Format\n\nTool use is formatted in XML tags inside. The tool name is enclosed in opening and closing tags, and each parameter is similarly enclosed within its own set of tags. Here\'s the structure:\n\n<tool_name>\n<parameter1_name>value1</parameter1_name>\n<parameter2_name>value2</parameter2_name>\n</tool_name>\n\nNote that the top level will **NEVER** have text content, all parameters are formed inside a child tag.\n\nFor example:\n\n<read_file>\n<path>src/main.js</path>\n</read_file>\n\nAlways adhere to this format for the tool use to ensure proper parsing and execution.\n\n## Available tools\n\n### read_file\n\nDescription: Read the content of a file\n\nParameters:\n\n- path: (required) The path to the file you want to read, must be a relative path\n\nUsage:\n\n<read_file>\n    <path>src/utils/index.ts</path>\n</read_file>\n\n### read_directory\n\nDescription: Read the file and child directories in a directory, at most 2000 files will be returned\n\nParameters:\n\n- path: (required) The path to the directory you want to read, must be a relative path\n- recursive: (optional) Whether to recursively read the directory\n\nUsage:\n\n<read_directory>\n    <path>src/utils</path>\n    <recursive>true</recursive>\n</read_directory>\n\n### find_files_by_glob\n\nDescription: Find files matching a glob pattern\n\nParameters:\n\n- glob: (required) The glob pattern to match files\n\nUsage:\n\n<find_files_by_glob>\n    <glob>src/common/**/*.{ts,tsx}</glob>\n</find_files_by_glob>\n\n### find_files_by_regex\n\nDescription: Find files matching a regular expression\n\nParameters:\n\n- path: (required) The path to the directory you want to search for, must be a relative path\n- regex: (required) A regular expression to match file content\n- glob: (optional) Glob pattern to match searched files, search for all text files when this parameter is not provided\n\nUsage:\n\n<find_files_by_regex>\n    <regex>export function [A-Z][a-zA-Z0-9]*\\(</regex>\n    <path>src/common</path>\n</find_files_by_regex>\n\n### write_file\n\nDescription: Write content to a file, creates the file if it does not exist\n\nParameters:\n\n- path: (required) The path to the file you want to write, must be a relative path\n- content: (required) The full content of the file, DO NOT lose anything in content, DO NOT use comments like "// existing..." to omit content\n\nUsage:\n\n<write_file>\n    <path>src/greeting.ts</path>\n    <content>\n    export function hello() {\n        return "hello";\n    }\n    </content>\n</write_file>\n\n### patch_file\n\nDescription: Patch a file with one or more patch blocks in special format\n\nParameters:\n\n- path: (required) The path to the file you want to patch, must be a relative path\n- patch: (required) One or more patch blocks exactly in the format illustrated below:\n```\n<<<<<<< SEARCH\n[Exact content to search]\n=======\n[New content to replace with]\n>>>>>>> REPLACE\n```\nRules for search and replace:\n1. `SEARCH` content must exactly match what in original file, including whitespace, indentation and line endings.\n2. Keep `SEARCH` part minimum, only include surrounding unmodified context lines if needed to locate content uniquely.\n3. Use multiple patch blocks if multiple parts of the file need to be modified.\n4. Use small patch blocks, split into multiple blocks if one includes unchanged lines in the middle.\n5. To move code, use two patch blocks, one to delete the original code and another to add it in a new location.\n6. To delete code, use a patch block with `REPLACE` part empty.\n\nUsage:\n\n<patch_file>\n    <path>src/utils/index.ts</path>\n    <patch>\n    <<<<<<< SEARCH\n    @media (prefers-color-scheme: light) {\n        color: #000;\n    =======\n    @media (prefers-color-scheme: dark) {\n        color: #fff;\n    >>>>>>> REPLACE\n    </patch>\n</patch_file>\n\n### delete_file\n\nDescription: Delete a file from the workspace\n\nParameters:\n\n- path: (required) The path to the file you want to delete, must be a relative path\n\nUsage:\n\n<delete_file>\n    <path>src/old-file.ts</path>\n</delete_file>\n\n### run_command\n\nDescription: Execute a CLI command on the system. To operate with system and perform tasks that are not covered by other tools, use this tool with a clear explanation of what the command does.\n\nParameters:\n\n- command: (required) The command to run, must be a valid shell command\n\nUsage:\n\n<run_command>\n    <command>ls -la</command>\n</run_command>\n\n### attempt_completion\n\nDescription: When you confirm the user request is completed, use this tool to present the result of your work to the user, it\'s better to also have an instruction about how to verify the result. Optionally you may provide a CLI command to showcase the result of your work.\n\nParameters:\n\n- result: (required) Your final result to user\'s request\n- command: (optional) Command to demonstrate result\n\nUsage:\n\n<attempt_completion>\n    <result>The result of your completion</result>\n    <command>The command you used to demonstrate the result</command>\n</attempt_completion>\n\n### ask_followup_question\n\nDescription: Ask the user a question to gather additional information needed to complete the task. This tool should be used when you encounter ambiguities, need clarification, or require more details to proceed effectively. It allows for interactive problem-solving by enabling direct communication with the user. Use this tool judiciously to maintain a balance between gathering necessary information and avoiding excessive back-and-forth\n\nParameters:\n\n- question: (required) The question to ask the user. This should be a clear, specific question that addresses the information you need\n\nUsage:\n\n<ask_followup_question>\n    <question>Your question</question>\n</ask_followup_question>\n\n## Tool Use Guidelines\n\n1. Choose the most appropriate tool based on the task and the tool descriptions provided. Assess if you need additional information to proceed, and which of the available tools would be most effective for gathering this information. For example using the list_files tool is more effective than running a command like `ls` in the terminal. It\'s critical that you think about each available tool and use the one that best fits the current step in the task.\n2. If multiple actions are needed, use one tool at a time per message to accomplish the task iteratively, with each tool use being informed by the result of the previous tool use. Do not assume the outcome of any tool use. Each step must be informed by the previous step\'s result.\n3. Formulate your tool use using the XML format specified for each tool.\n4. After each tool use, the user will respond with the result of that tool use. This result will provide you with the necessary information to continue your task or make further decisions. This response may include:\n    - Information about whether the tool succeeded or failed, along with any reasons for failure.\n    - Linter errors that may have arisen due to the changes you made, which you\'ll need to address.\n    - New terminal output in reaction to the changes, which you may need to consider or act upon.\n    - Any other relevant feedback or information related to the tool use.\n5. ALWAYS wait for user confirmation after each tool use before proceeding. Never assume the success of a tool use without explicit confirmation of the result from the user.\n6. For each message, when you provide a tool via XML format, you SHOULD NOT generate any content after the tool use.\n\nIt is crucial to proceed step-by-step, waiting for the user\'s message after each tool use before moving forward with the task. This approach allows you to:\n\n1. Confirm the success of each step before proceeding.\n2. Address any issues or errors that arise immediately.\n3. Adapt your approach based on new information or unexpected results.\n4. Ensure that each action builds correctly on the previous ones.\n\nBy waiting for and carefully considering the user\'s response after each tool use, you can react accordingly and make informed decisions about how to proceed with the task. This iterative process helps ensure the overall success and accuracy of your work.\n\n# Context\n\nThis section provides some already known information for user\'s request.\n\n## Project Structure\n\nThis is a full structure of the project, you can inform these to narrow search scopes or read exact file from root directory. nested directories can be merged into a single line containing `/`  directories end with `/`.}\n\n.editorconfig\n.github/\n  release-please-config.json\n  release-please-manifest.json\n  renovate.json\n  workflows/\n    coverage.yml\n    node.yml\n    notify.yml\n    publish.yml\n    release.yml\n.gitignore\n.husky/\n  _/\n  commit-msg\n  pre-commit\n  pre-push\n.node-version\nCHANGELOG.md\ncommitlint.config.js\ndprint.json\neslint.config.js\nLICENSE\npackage-lock.json\npackage.json\nREADME.md\nsrc/\n  __tests__/\n    controller.test.ts\n  controller.ts\n  factory/\n    __tests__/\n      array.test.ts\n      event.test.ts\n      reader.test.ts\n      stream.test.ts\n    array.ts\n    event.ts\n    reader.ts\n    stream.ts\n  helper/\n      index.test.ts\n    index.ts\n    operators/\n      __tests__/\n        chunk.test.ts\n        debounce.test.ts\n        filter.test.ts\n        map.test.ts\n        take.test.ts\n        until.test.ts\n      chunk.ts\n      debounce.ts\n      filter.ts\n      interface.ts\n      map.ts\n      take.ts\n      until.ts\n  index.ts\ntsconfig.build.json\ntsconfig.cjs.json\ntsconfig.esm.json\ntsconfig.json\nvite.config.ts\n\n# Objective\n\nYou accomplish a given task iteratively, breaking it down into clear steps and working through them methodically.\n\n1. Analyze the user\'s task and set clear, achievable goals to accomplish it. Prioritize these goals in a logical order.\n2. Work through these goals sequentially, utilizing available tools one at a time as necessary. Each goal should correspond to a distinct step in your problem-solving process. You will be informed on the work completed and what\'s remaining as you go.\n3. Remember, you have extensive capabilities with access to a wide range of tools that can be used in powerful and clever ways as necessary to accomplish each goal. Before calling a tool, do some analysis within <thinking></thinking> tags.\n    - First, analyze the file structure provided in environment_details to gain context and insights for proceeding effectively.\n    - Then, think about which of the provided tools is the most relevant tool to accomplish the user\'s task.\n    - Next, go through each of the required parameters of the relevant tool and determine if the user has directly provided or given enough information to infer a value.\n    - When deciding if the parameter can be inferred, carefully consider all the context to see if it supports a specific value.\n    - Write out what XML tags are used to construct the tool call, present tags in XML form like `<read_file`> and `<path>`, only tag names are required inside thinking tag, do not put values here.\n    - If all of the required parameters are present or can be reasonably inferred, close the thinking tag and proceed with the tool use.\n    - BUT, if one of the values for a required parameter is missing, DO NOT invoke the tool (not even with fillers for the missing params) and instead, ask the user to provide the missing parameters using the ask_followup_question tool.\n    - DO NOT ask for more information on optional parameters if it is not provided.\n4. Once you\'ve completed the user\'s task, you must use the attempt_completion tool to present the result of the task to the user. You may also provide a CLI command to showcase the result of your task; this can be particularly useful for web development tasks, where you can run e.g. `open index.html` to show the website you\'ve built.\n5. When it is not clear to generate cod to satisfy user\'s request, e.g. some number or string values are not provided from user, do not try to determine by yourself, you should use the ask_followup_question for followup informations.\n6. The user may provide feedback, which you can use to make improvements and try again. But DO NOT continue in pointless back and forth conversations, i.e. don\'t end your responses with questions or offers for further assistance.\n\nYour response should almost always formed in this structure:\n\n1. Some analytics and thoughts in plain text, this may includes code edits explained in "Format" section above.\n2. If not using the attempt_completion or ask_followup_question tool, place a <thinking></thinking> tag in which you should think the usage of a tool, it must includes at least the tool name and all its required parameters\'s value, tool and parameters are expressed in its original names, do not translate them. Carefully explain why and how you are going to use the tool.\n3. A tool call in a XML-style tag, use the tool name as root tag, carefully put every parameter you thought in <thinking></thinkging> as an child tag. You MUST use one tool per message, and the tool usage must happen at the end of the message, you should not output anything after a tool call.\n\nNote your thoughts inside <thinking></thinking> are required to contain the reason using a tool, a explanation of the tool call XML tag structure is followed, then you call that tool by using the tool name as root tag, each parameter as a child tag, this is a example using read_directory tool:\n\n```\n<thinking>\nI should use the read_directory tool to inspect the structure of project source.\n\nTo call this tool, I need a <read_directory> root element with <path> and <recursive> child tags.\n</thinking>\n<read_directory>\n<path>src</path>\n<recursive>true</recursive>\n</read_directory>\n```\n\nYou should always carefully check the XML structure of a tool call with its preceding <thinking></thinking> tag, never loose any parameter tags in tool call.',
                            },
                        },
                    },
                    {
                        type: 'workflow',
                        workflow: {
                            status: 'completed',
                            origin: {
                                uuid: 'a3d15aed-ce0f-4f23-8669-6a279d3bea8a',
                                createdAt: '2025-02-21T04:41:10.214Z',
                                type: 'toolCall',
                                chunks: [
                                    {
                                        type: 'text',
                                        content:
                                            '我来帮你删除 chunk 运算符相关的文件。首先我需要确认相关文件的位置。\n\n',
                                    },
                                    {
                                        type: 'thinking',
                                        content:
                                            '\n我应该使用 find_files_by_glob 工具来查找所有包含 chunk 的文件。\n\n需要使用 <find_files_by_glob> 标签，包含 <glob> 子标签来指定搜索模式。\n',
                                        status: 'completed',
                                    },
                                    {
                                        type: 'text',
                                        content: '\n',
                                    },
                                    {
                                        type: 'toolCall',
                                        toolName: 'find_files_by_glob',
                                        arguments: {
                                            glob: 'src/**/*chunk*.{ts,tsx}',
                                        },
                                        status: 'completed',
                                        fileEdit: null,
                                        source:
                                            '<find_files_by_glob>\n<glob>src/**/*chunk*.{ts,tsx}</glob>\n</find_files_by_glob>',
                                    },
                                ],
                            },
                            reactions: [
                                {
                                    uuid: '20215370-ab3d-45d2-9c12-9dcfd47a6863',
                                    createdAt: '2025-02-21T04:41:17.841Z',
                                    type: 'toolUse',
                                    content:
                                        'Files matching glob src/**/*chunk*.{ts,tsx}:\n\n```\nsrc/helper/operators/chunk.ts\nsrc/helper/operators/__tests__/chunk.test.ts\n```',
                                },
                            ],
                            exposed: [
                                '20215370-ab3d-45d2-9c12-9dcfd47a6863',
                            ],
                        },
                    },
                    {
                        type: 'workflow',
                        workflow: {
                            status: 'completed',
                            origin: {
                                uuid: '8965726a-bf2b-44f8-b706-7c60e55c189d',
                                createdAt: '2025-02-21T04:41:17.841Z',
                                type: 'toolCall',
                                chunks: [
                                    {
                                        type: 'text',
                                        content:
                                            '找到了两个需要删除的文件:\n1. `src/helper/operators/chunk.ts` - chunk 运算符的实现文件\n2. `src/helper/operators/__tests__/chunk.test.ts` - chunk 运算符的测试文件\n\n让我们先检查一下 `interface.ts` 看看是否需要移除相关的类型定义。\n\n',
                                    },
                                    {
                                        type: 'thinking',
                                        content:
                                            '\n我需要使用 read_file 工具来查看接口文件的内容。\n\n需要使用 <read_file> 标签，包含 <path> 子标签指向接口文件。\n',
                                        status: 'completed',
                                    },
                                    {
                                        type: 'text',
                                        content: '\n',
                                    },
                                    {
                                        type: 'toolCall',
                                        toolName: 'read_file',
                                        arguments: {
                                            path: 'src/helper/operators/interface.ts',
                                        },
                                        status: 'completed',
                                        fileEdit: null,
                                        source:
                                            '<read_file>\n<path>src/helper/operators/interface.ts</path>\n</read_file>',
                                    },
                                ],
                            },
                            reactions: [
                                {
                                    uuid: '9845f730-74cd-4a9a-941b-4f5e940c6f17',
                                    createdAt: '2025-02-21T04:41:23.426Z',
                                    type: 'toolUse',
                                    content:
                                        'Content of file src/helper/operators/interface.ts:\n\n```ts\nexport type Predicate<T> = (value: T) => boolean | Promise<boolean>;\n\nexport type Transform<T, R> = (value: T) => R | Promise<R>;\n\n```',
                                },
                            ],
                            exposed: [
                                '9845f730-74cd-4a9a-941b-4f5e940c6f17',
                            ],
                        },
                    },
                    {
                        type: 'workflow',
                        workflow: {
                            status: 'completed',
                            origin: {
                                uuid: '951e2082-c9a0-43a0-aa43-2a864242624e',
                                createdAt: '2025-02-21T04:41:23.426Z',
                                type: 'toolCall',
                                chunks: [
                                    {
                                        type: 'text',
                                        content:
                                            '看起来 `interface.ts` 中没有 chunk 相关的类型定义。\n\n接下来我们需要检查一下 chunk 运算符是否在其他地方被导出。让我们检查 `src/helper/index.ts`。\n\n',
                                    },
                                    {
                                        type: 'toolCall',
                                        toolName: 'read_file',
                                        arguments: {
                                            path: 'src/helper/index.ts',
                                        },
                                        status: 'completed',
                                        fileEdit: null,
                                        source: '<read_file>\n<path>src/helper/index.ts</path>\n</read_file>',
                                    },
                                ],
                            },
                            reactions: [
                                {
                                    uuid: '1219f73f-b6b4-47ae-ac97-846cbade48aa',
                                    createdAt: '2025-02-21T04:41:27.613Z',
                                    type: 'toolUse',
                                    content:
                                        'Content of file src/helper/index.ts:\n\n```ts\nimport {Predicate, Transform} from \'./operators/interface.js\';\nimport {filter} from \'./operators/filter.js\';\nimport {chunk} from \'./operators/chunk.js\';\nimport {debounce} from \'./operators/debounce.js\';\nimport {map} from \'./operators/map.js\';\nimport {take} from \'./operators/take.js\';\nimport {until} from \'./operators/until.js\';\n\nexport interface OverAsyncIterator<T> extends AsyncIterable<T> {\n    filter(predicate: Predicate<T>): OverAsyncIterator<T>;\n    map<R>(transform: (value: T) => R): OverAsyncIterator<R>;\n    chunk(size: number): OverAsyncIterator<T[]>;\n    debounce(ms: number): OverAsyncIterator<T[]>;\n    take(count: number): OverAsyncIterator<T>;\n    until(predicate: Predicate<T>): OverAsyncIterator<T>;\n}\n\nexport function over<T>(iterable: AsyncIterable<T>): OverAsyncIterator<T> {\n    return {\n        /**\n         * Filter elements wiht a predicate\n         *\n         * @param predicate Predicate function to decide if an element should be yielded or not\n         * @returns A new `OverAsyncIterator` instance including the `filter` operator\n         */\n        filter(predicate: Predicate<T>): OverAsyncIterator<T> {\n            return over(filter(iterable, predicate));\n        },\n\n        /**\n         * Map elements wiht a transformer\n         *\n         * @param transform Transform function to transform an element into another\n         * @returns A new `OverAsyncIterator` instance including the `map` operator\n         */\n        map<R>(transform: Transform<T, R>): OverAsyncIterator<R> {\n            return over(map(iterable, transform));\n        },\n\n        /**\n         * Group elements into chunks by a size\n         *\n         * @param size Chunk size\n         * @returns A new `OverAsyncIterator` instance including the `chunk` operator\n         */\n        chunk(size: number): OverAsyncIterator<T[]> {\n            return over(chunk(iterable, size));\n        },\n\n        /**\n         * Debounce the emit of element by a given amount of time,\n         * all elements within debounce timeout will emit once as an array\n         *\n         * @param ms Debounce timeout\n         * @returns A new `OverAsyncIterator` instance including the `debounce` operator\n         */\n        debounce(ms: number): OverAsyncIterator<T[]> {\n            return over(debounce(iterable, ms));\n        },\n\n        /**\n         * Take the first n elements\n         *\n         * @param count element count to be token\n         * @returns A new `OverAsyncIterator` instance including the `take` operator\n         */\n        take(count: number): OverAsyncIterator<T> {\n            return over(take(iterable, count));\n        },\n\n        /**\n         * Take elements until a predicate match\n         *\n         * @param predicate Predicate function to decide if the iterator should stop,\n         * the element match the predicate will not yield\n         * @returns A new `OverAsyncIterator` instance including the `until` operator\n         */\n        until(predicate: (value: T) => boolean): OverAsyncIterator<T> {\n            return over(until(iterable, predicate));\n        },\n\n        [Symbol.asyncIterator]() {\n            return iterable[Symbol.asyncIterator]();\n        },\n    };\n}\n\n```',
                                },
                            ],
                            exposed: [
                                '1219f73f-b6b4-47ae-ac97-846cbade48aa',
                            ],
                        },
                    },
                    {
                        type: 'workflow',
                        workflow: {
                            status: 'completed',
                            origin: {
                                uuid: 'eebfeeb9-3535-4f62-9586-8d9f88fed591',
                                createdAt: '2025-02-21T04:41:27.613Z',
                                type: 'toolCall',
                                chunks: [
                                    {
                                        type: 'text',
                                        content:
                                            '我看到在 `src/helper/index.ts` 中有 chunk 相关的导入、类型定义和实现，我们需要修改这个文件来移除 chunk 相关的代码。\n\n让我们按以下步骤进行：\n\n1. 首先修改 `src/helper/index.ts` 文件，移除所有 chunk 相关的代码\n2. 然后删除 chunk 的实现文件和测试文件\n\n',
                                    },
                                    {
                                        type: 'thinking',
                                        content:
                                            '\n我需要使用 patch_file 工具来修改 `src/helper/index.ts`，需要移除：\n1. chunk 的导入语句\n2. OverAsyncIterator 接口中的 chunk 方法定义\n3. over 函数返回对象中的 chunk 方法实现\n\n使用 <patch_file> 根标签，包含 <path> 和 <patch> 子标签\n',
                                        status: 'completed',
                                    },
                                    {
                                        type: 'text',
                                        content: '\n',
                                    },
                                    {
                                        type: 'toolCall',
                                        toolName: 'patch_file',
                                        arguments: {
                                            path: 'src/helper/index.ts',
                                            patch:
                                                '\n<<<<<<< SEARCH\nimport {chunk} from \'./operators/chunk.js\';\n=======\n>>>>>>> REPLACE\n\n<<<<<<< SEARCH\n    chunk(size: number): OverAsyncIterator<T[]>;\n=======\n>>>>>>> REPLACE\n\n<<<<<<< SEARCH\n        /**\n         * Group elements into chunks by a size\n         *\n         * @param size Chunk size\n         * @returns A new `OverAsyncIterator` instance including the `chunk` operator\n         */\n        chunk(size: number): OverAsyncIterator<T[]> {\n            return over(chunk(iterable, size));\n        },\n\n=======\n>>>>>>> REPLACE\n',
                                        },
                                        status: 'completed',
                                        fileEdit: {
                                            file: 'src/helper/index.ts',
                                            oldContent:
                                                'import {Predicate, Transform} from \'./operators/interface.js\';\nimport {filter} from \'./operators/filter.js\';\nimport {chunk} from \'./operators/chunk.js\';\nimport {debounce} from \'./operators/debounce.js\';\nimport {map} from \'./operators/map.js\';\nimport {take} from \'./operators/take.js\';\nimport {until} from \'./operators/until.js\';\n\nexport interface OverAsyncIterator<T> extends AsyncIterable<T> {\n    filter(predicate: Predicate<T>): OverAsyncIterator<T>;\n    map<R>(transform: (value: T) => R): OverAsyncIterator<R>;\n    chunk(size: number): OverAsyncIterator<T[]>;\n    debounce(ms: number): OverAsyncIterator<T[]>;\n    take(count: number): OverAsyncIterator<T>;\n    until(predicate: Predicate<T>): OverAsyncIterator<T>;\n}\n\nexport function over<T>(iterable: AsyncIterable<T>): OverAsyncIterator<T> {\n    return {\n        /**\n         * Filter elements wiht a predicate\n         *\n         * @param predicate Predicate function to decide if an element should be yielded or not\n         * @returns A new `OverAsyncIterator` instance including the `filter` operator\n         */\n        filter(predicate: Predicate<T>): OverAsyncIterator<T> {\n            return over(filter(iterable, predicate));\n        },\n\n        /**\n         * Map elements wiht a transformer\n         *\n         * @param transform Transform function to transform an element into another\n         * @returns A new `OverAsyncIterator` instance including the `map` operator\n         */\n        map<R>(transform: Transform<T, R>): OverAsyncIterator<R> {\n            return over(map(iterable, transform));\n        },\n\n        /**\n         * Group elements into chunks by a size\n         *\n         * @param size Chunk size\n         * @returns A new `OverAsyncIterator` instance including the `chunk` operator\n         */\n        chunk(size: number): OverAsyncIterator<T[]> {\n            return over(chunk(iterable, size));\n        },\n\n        /**\n         * Debounce the emit of element by a given amount of time,\n         * all elements within debounce timeout will emit once as an array\n         *\n         * @param ms Debounce timeout\n         * @returns A new `OverAsyncIterator` instance including the `debounce` operator\n         */\n        debounce(ms: number): OverAsyncIterator<T[]> {\n            return over(debounce(iterable, ms));\n        },\n\n        /**\n         * Take the first n elements\n         *\n         * @param count element count to be token\n         * @returns A new `OverAsyncIterator` instance including the `take` operator\n         */\n        take(count: number): OverAsyncIterator<T> {\n            return over(take(iterable, count));\n        },\n\n        /**\n         * Take elements until a predicate match\n         *\n         * @param predicate Predicate function to decide if the iterator should stop,\n         * the element match the predicate will not yield\n         * @returns A new `OverAsyncIterator` instance including the `until` operator\n         */\n        until(predicate: (value: T) => boolean): OverAsyncIterator<T> {\n            return over(until(iterable, predicate));\n        },\n\n        [Symbol.asyncIterator]() {\n            return iterable[Symbol.asyncIterator]();\n        },\n    };\n}\n',
                                            type: 'edit',
                                            newContent:
                                                'import {Predicate, Transform} from \'./operators/interface.js\';\nimport {filter} from \'./operators/filter.js\';\nimport {debounce} from \'./operators/debounce.js\';\nimport {map} from \'./operators/map.js\';\nimport {take} from \'./operators/take.js\';\nimport {until} from \'./operators/until.js\';\n\nexport interface OverAsyncIterator<T> extends AsyncIterable<T> {\n    filter(predicate: Predicate<T>): OverAsyncIterator<T>;\n    map<R>(transform: (value: T) => R): OverAsyncIterator<R>;\n    debounce(ms: number): OverAsyncIterator<T[]>;\n    take(count: number): OverAsyncIterator<T>;\n    until(predicate: Predicate<T>): OverAsyncIterator<T>;\n}\n\nexport function over<T>(iterable: AsyncIterable<T>): OverAsyncIterator<T> {\n    return {\n        /**\n         * Filter elements wiht a predicate\n         *\n         * @param predicate Predicate function to decide if an element should be yielded or not\n         * @returns A new `OverAsyncIterator` instance including the `filter` operator\n         */\n        filter(predicate: Predicate<T>): OverAsyncIterator<T> {\n            return over(filter(iterable, predicate));\n        },\n\n        /**\n         * Map elements wiht a transformer\n         *\n         * @param transform Transform function to transform an element into another\n         * @returns A new `OverAsyncIterator` instance including the `map` operator\n         */\n        map<R>(transform: Transform<T, R>): OverAsyncIterator<R> {\n            return over(map(iterable, transform));\n        },\n\n        /**\n         * Debounce the emit of element by a given amount of time,\n         * all elements within debounce timeout will emit once as an array\n         *\n         * @param ms Debounce timeout\n         * @returns A new `OverAsyncIterator` instance including the `debounce` operator\n         */\n        debounce(ms: number): OverAsyncIterator<T[]> {\n            return over(debounce(iterable, ms));\n        },\n\n        /**\n         * Take the first n elements\n         *\n         * @param count element count to be token\n         * @returns A new `OverAsyncIterator` instance including the `take` operator\n         */\n        take(count: number): OverAsyncIterator<T> {\n            return over(take(iterable, count));\n        },\n\n        /**\n         * Take elements until a predicate match\n         *\n         * @param predicate Predicate function to decide if the iterator should stop,\n         * the element match the predicate will not yield\n         * @returns A new `OverAsyncIterator` instance including the `until` operator\n         */\n        until(predicate: (value: T) => boolean): OverAsyncIterator<T> {\n            return over(until(iterable, predicate));\n        },\n\n        [Symbol.asyncIterator]() {\n            return iterable[Symbol.asyncIterator]();\n        },\n    };\n}\n',
                                            deletedCount: 12,
                                            insertedCount: 0,
                                        },
                                        source:
                                            '<patch_file>\n<path>src/helper/index.ts</path>\n<patch>\n<<<<<<< SEARCH\nimport {chunk} from \'./operators/chunk.js\';\n=======\n>>>>>>> REPLACE\n\n<<<<<<< SEARCH\n    chunk(size: number): OverAsyncIterator<T[]>;\n=======\n>>>>>>> REPLACE\n\n<<<<<<< SEARCH\n        /**\n         * Group elements into chunks by a size\n         *\n         * @param size Chunk size\n         * @returns A new `OverAsyncIterator` instance including the `chunk` operator\n         */\n        chunk(size: number): OverAsyncIterator<T[]> {\n            return over(chunk(iterable, size));\n        },\n\n=======\n>>>>>>> REPLACE\n</patch>\n</patch_file>',
                                    },
                                ],
                            },
                            reactions: [
                                {
                                    uuid: '418fd5e9-1a04-40b1-9bbe-5ae954545cfb',
                                    createdAt: '2025-02-21T04:41:36.386Z',
                                    type: 'toolUse',
                                    content:
                                        'Patch is written to src/helper/index.ts, here is the new content of this file:\n\n```\nimport {Predicate, Transform} from \'./operators/interface.js\';\nimport {filter} from \'./operators/filter.js\';\nimport {debounce} from \'./operators/debounce.js\';\nimport {map} from \'./operators/map.js\';\nimport {take} from \'./operators/take.js\';\nimport {until} from \'./operators/until.js\';\n\nexport interface OverAsyncIterator<T> extends AsyncIterable<T> {\n    filter(predicate: Predicate<T>): OverAsyncIterator<T>;\n    map<R>(transform: (value: T) => R): OverAsyncIterator<R>;\n    debounce(ms: number): OverAsyncIterator<T[]>;\n    take(count: number): OverAsyncIterator<T>;\n    until(predicate: Predicate<T>): OverAsyncIterator<T>;\n}\n\nexport function over<T>(iterable: AsyncIterable<T>): OverAsyncIterator<T> {\n    return {\n        /**\n         * Filter elements wiht a predicate\n         *\n         * @param predicate Predicate function to decide if an element should be yielded or not\n         * @returns A new `OverAsyncIterator` instance including the `filter` operator\n         */\n        filter(predicate: Predicate<T>): OverAsyncIterator<T> {\n            return over(filter(iterable, predicate));\n        },\n\n        /**\n         * Map elements wiht a transformer\n         *\n         * @param transform Transform function to transform an element into another\n         * @returns A new `OverAsyncIterator` instance including the `map` operator\n         */\n        map<R>(transform: Transform<T, R>): OverAsyncIterator<R> {\n            return over(map(iterable, transform));\n        },\n\n        /**\n         * Debounce the emit of element by a given amount of time,\n         * all elements within debounce timeout will emit once as an array\n         *\n         * @param ms Debounce timeout\n         * @returns A new `OverAsyncIterator` instance including the `debounce` operator\n         */\n        debounce(ms: number): OverAsyncIterator<T[]> {\n            return over(debounce(iterable, ms));\n        },\n\n        /**\n         * Take the first n elements\n         *\n         * @param count element count to be token\n         * @returns A new `OverAsyncIterator` instance including the `take` operator\n         */\n        take(count: number): OverAsyncIterator<T> {\n            return over(take(iterable, count));\n        },\n\n        /**\n         * Take elements until a predicate match\n         *\n         * @param predicate Predicate function to decide if the iterator should stop,\n         * the element match the predicate will not yield\n         * @returns A new `OverAsyncIterator` instance including the `until` operator\n         */\n        until(predicate: (value: T) => boolean): OverAsyncIterator<T> {\n            return over(until(iterable, predicate));\n        },\n\n        [Symbol.asyncIterator]() {\n            return iterable[Symbol.asyncIterator]();\n        },\n    };\n}\n\n```',
                                },
                            ],
                            exposed: [
                                '418fd5e9-1a04-40b1-9bbe-5ae954545cfb',
                            ],
                        },
                    },
                    {
                        type: 'workflow',
                        workflow: {
                            status: 'completed',
                            origin: {
                                uuid: '8b4dc474-4495-4573-8dc7-be77eba7d6c9',
                                createdAt: '2025-02-21T04:41:36.386Z',
                                type: 'toolCall',
                                chunks: [
                                    {
                                        type: 'text',
                                        content:
                                            '很好，`src/helper/index.ts` 已经成功移除了所有 chunk 相关的代码。现在让我们删除 chunk 的实现文件和测试文件。\n\n',
                                    },
                                    {
                                        type: 'thinking',
                                        content:
                                            '\n我需要使用 delete_file 工具来删除这两个文件。我会分两步进行，先删除实现文件，再删除测试文件。\n\n第一步使用 <delete_file> 标签和 <path> 子标签删除实现文件。\n',
                                        status: 'completed',
                                    },
                                    {
                                        type: 'text',
                                        content: '\n',
                                    },
                                    {
                                        type: 'toolCall',
                                        toolName: 'delete_file',
                                        arguments: {
                                            path: 'src/helper/operators/chunk.ts',
                                        },
                                        status: 'completed',
                                        fileEdit: {
                                            file: 'src/helper/operators/chunk.ts',
                                            oldContent:
                                                'export async function* chunk<T>(iterator: AsyncIterable<T>, size: number): AsyncIterable<T[]> {\n    const state = {\n        current: [] as T[],\n    };\n\n    for await (const value of iterator) {\n        state.current.push(value);\n        if (state.current.length === size) {\n            yield state.current;\n            state.current = [];\n        }\n    }\n\n    if (state.current.length > 0) {\n        yield state.current;\n    }\n}\n',
                                            type: 'delete',
                                            newContent: '',
                                            deletedCount: 18,
                                            insertedCount: 0,
                                        },
                                        source:
                                            '<delete_file>\n<path>src/helper/operators/chunk.ts</path>\n</delete_file>',
                                    },
                                ],
                            },
                            reactions: [
                                {
                                    uuid: '90567afc-568c-44c6-8c9c-55862a989b0e',
                                    createdAt: '2025-02-21T04:41:42.106Z',
                                    type: 'toolUse',
                                    content: 'File src/helper/operators/chunk.ts is deleted',
                                },
                            ],
                            exposed: [
                                '90567afc-568c-44c6-8c9c-55862a989b0e',
                            ],
                        },
                    },
                    {
                        type: 'workflow',
                        workflow: {
                            status: 'completed',
                            origin: {
                                uuid: '228b3da1-a12f-4cb1-bba7-d926555cc1b0',
                                createdAt: '2025-02-21T04:41:42.106Z',
                                type: 'toolCall',
                                chunks: [
                                    {
                                        type: 'text',
                                        content: '现在让我们删除 chunk 的测试文件。\n\n',
                                    },
                                    {
                                        type: 'toolCall',
                                        toolName: 'delete_file',
                                        arguments: {
                                            path: 'src/helper/operators/__tests__/chunk.test.ts',
                                        },
                                        status: 'completed',
                                        fileEdit: {
                                            file: 'src/helper/operators/__tests__/chunk.test.ts',
                                            oldContent:
                                                'import {expect, test} from \'vitest\';\nimport {chunk} from \'../chunk.js\';\n\nasync function* generate() {\n    yield 1;\n    await Promise.resolve();\n    yield 2;\n    yield 3;\n    await Promise.resolve();\n    yield 4;\n    yield 5;\n}\n\nasync function* empty() {\n}\n\ntest(\'chunk with size 2\', async () => {\n    const iterable = chunk(generate(), 2);\n    const iterator = iterable[Symbol.asyncIterator]();\n    await expect(iterator.next()).resolves.toEqual({value: [1, 2], done: false});\n    await expect(iterator.next()).resolves.toEqual({value: [3, 4], done: false});\n    await expect(iterator.next()).resolves.toEqual({value: [5], done: false});\n    await expect(iterator.next()).resolves.toEqual({value: undefined, done: true});\n});\n\ntest(\'chunk with size larger than input\', async () => {\n    const iterable = chunk(generate(), 10);\n    const iterator = iterable[Symbol.asyncIterator]();\n    await expect(iterator.next()).resolves.toEqual({value: [1, 2, 3, 4, 5], done: false});\n    await expect(iterator.next()).resolves.toEqual({value: undefined, done: true});\n});\n\ntest(\'chunk with size 1\', async () => {\n    const iterable = chunk(generate(), 1);\n    const iterator = iterable[Symbol.asyncIterator]();\n    await expect(iterator.next()).resolves.toEqual({value: [1], done: false});\n    await expect(iterator.next()).resolves.toEqual({value: [2], done: false});\n    await expect(iterator.next()).resolves.toEqual({value: [3], done: false});\n    await expect(iterator.next()).resolves.toEqual({value: [4], done: false});\n    await expect(iterator.next()).resolves.toEqual({value: [5], done: false});\n    await expect(iterator.next()).resolves.toEqual({value: undefined, done: true});\n});\n\ntest(\'chunk with empty input\', async () => {\n    const iterable = chunk(empty(), 2);\n    const iterator = iterable[Symbol.asyncIterator]();\n    await expect(iterator.next()).resolves.toEqual({value: undefined, done: true});\n});\n',
                                            type: 'delete',
                                            newContent: '',
                                            deletedCount: 49,
                                            insertedCount: 0,
                                        },
                                        source:
                                            '<delete_file>\n<path>src/helper/operators/__tests__/chunk.test.ts</path>\n</delete_file>',
                                    },
                                ],
                            },
                            reactions: [
                                {
                                    uuid: 'b14001f8-1413-4828-90a6-144c1e923798',
                                    createdAt: '2025-02-21T04:41:45.282Z',
                                    type: 'toolUse',
                                    content: 'File src/helper/operators/__tests__/chunk.test.ts is deleted',
                                },
                            ],
                            exposed: [
                                'b14001f8-1413-4828-90a6-144c1e923798',
                            ],
                        },
                    },
                    {
                        type: 'message',
                        message: {
                            uuid: 'b997c84b-5ed8-4b7b-a816-370752b59dbf',
                            createdAt: '2025-02-21T04:41:45.282Z',
                            type: 'assistantText',
                            chunks: [
                                {
                                    type: 'text',
                                    content:
                                        '好的，我们已经完成了所有必要的步骤：\n\n1. 从 `src/helper/index.ts` 中移除了 chunk 相关的：\n   - 导入语句\n   - 接口定义\n   - 实现代码\n2. 删除了 chunk 运算符的实现文件 `src/helper/operators/chunk.ts`\n3. 删除了 chunk 运算符的测试文件 `src/helper/operators/__tests__/chunk.test.ts`\n\n让我通知你任务已完成。\n\n',
                                },
                                {
                                    type: 'toolCall',
                                    toolName: 'attempt_completion',
                                    arguments: {
                                        result:
                                            '成功删除了 chunk 运算符相关的所有代码，包括：\n- 移除了 src/helper/index.ts 中的相关代码\n- 删除了实现文件 src/helper/operators/chunk.ts\n- 删除了测试文件 src/helper/operators/__tests__/chunk.test.ts',
                                    },
                                    status: 'completed',
                                    fileEdit: null,
                                    source:
                                        '<attempt_completion>\n<result>成功删除了 chunk 运算符相关的所有代码，包括：\n- 移除了 src/helper/index.ts 中的相关代码\n- 删除了实现文件 src/helper/operators/chunk.ts\n- 删除了测试文件 src/helper/operators/__tests__/chunk.test.ts</result>\n</attempt_completion>',
                                },
                            ],
                        },
                    },
                ],
            },
        ],
    },
];

export const store = new ThreadStore(process.env.NODE_ENV === 'development' ? debugMessageThreadFixtures : []);
