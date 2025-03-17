import dedent from 'dedent';
import type {ToolDescription, ToolName} from '@oniichan/shared/tool';
import type {InboxPromptView} from './interface';
import {IncludeExclude} from '@oniichan/shared/array';

const prefix = dedent`
    # Tool

    You can use several tools handling user request, you can **only use one tool per message**, the result of tool use will be provided in the next message, each tool use informed by previous uses.

    ## Tool Use Format

    Tool use is formatted in XML tags inside. The tool name is enclosed in opening and closing tags, and each parameter is similarly enclosed within its own set of tags. Here's the structure:

    <tool_name>
    <parameter1_name>value1</parameter1_name>
    <parameter2_name>value2</parameter2_name>
    </tool_name>

    Note that the top level will **NEVER** have text content, all parameters are formed inside a child tag.

    For example:

    <read_file>
    <path>src/main.js</path>
    </read_file>

    Always adhere to this format for the tool use to ensure proper parsing and execution.

    If a parameter is defined as an array, it's name is provided as \`param[]\`, then you can include multiple parameter child tags inside the tool tag, such as:

    <create_plan>
    <read>Read main.js</read>
    <read>Read package.json</read>
    </create_plan>
`;

const guideline = dedent`
    ## Tool Use Guidelines

    1. Choose the most appropriate tool based on the task and the tool descriptions provided. Assess if you need additional information to proceed, and which of the available tools would be most effective for gathering this information. For example using the list_files tool is more effective than running a command like \`ls\` in the terminal. It's critical that you think about each available tool and use the one that best fits the current step in the task.
    2. If multiple actions are needed, use one tool at a time per message to accomplish the task iteratively, with each tool use being informed by the result of the previous tool use. Do not assume the outcome of any tool use. Each step must be informed by the previous step's result.
    3. Formulate your tool use using the XML format specified for each tool.
    4. After each tool use, the user will respond with the result of that tool use. This result will provide you with the necessary information to continue your task or make further decisions. This response may include:
        - Information about whether the tool succeeded or failed, along with any reasons for failure.
        - Linter errors that may have arisen due to the changes you made, which you'll need to address.
        - New terminal output in reaction to the changes, which you may need to consider or act upon.
        - Any other relevant feedback or information related to the tool use.
    5. ALWAYS wait for user confirmation after each tool use before proceeding. Never assume the success of a tool use without explicit confirmation of the result from the user.
    6. For each message, when you provide a tool via XML format, you SHOULD NOT generate any content after the tool use.
    7. Never include tool name outside of <thinking></thinking> tag in your response.

    It is crucial to proceed step-by-step, waiting for the user's message after each tool use before moving forward with the task. This approach allows you to:

    1. Confirm the success of each step before proceeding.
    2. Address any issues or errors that arise immediately.
    3. Adapt your approach based on new information or unexpected results.
    4. Ensure that each action builds correctly on the previous ones.

    By waiting for and carefully considering the user's response after each tool use, you can react accordingly and make informed decisions about how to proceed with the task. This iterative process helps ensure the overall success and accuracy of your work.
`;

function renderParameter(description: ToolDescription, name: string) {
    const info = description.parameters.properties[name];
    const required = description.parameters.required.includes(name);

    return dedent`
        - ${name}${info.type === 'array' ? '[]' : ''}: (${required ? 'required' : 'optional'}) ${info.description}
    `;
}

function renderItem(item: ToolDescription) {
    const lines = [
        `### ${item.name}`,
        '',
        `Description: ${item.description}`,
        '',
        'Parameters:',
        '',
        ...Object.keys(item.parameters.properties).map(v => renderParameter(item, v)),
        '',
        'Usage:',
        '',
        item.usage,
    ];
    return lines.join('\n');
}

export function renderToolSection(view: InboxPromptView) {
    const available = new IncludeExclude<ToolName>();
    switch (view.mode) {
        case 'planner':
            available.include('create_plan');
            available.include('attempt_completion');
            break;
        case 'actor':
            available.include('read_file');
            available.include('read_directory');
            available.include('find_files_by_glob');
            available.include('find_files_by_regex');
            available.include('complete_task');
            break;
        case 'coder':
            available.exclude('ask_followup_question');
            available.exclude('attempt_completion');
            available.exclude('create_plan');
            break;
        case 'standalone':
            available.exclude('complete_task');
            available.exclude('create_plan');
            break;
    }

    if (!view.projectStructure) {
        available.exclude('browser_preview');
    }

    const tools = view.tools.filter(v => available.allow(v.name));

    if (tools.length) {
        const parts = [
            prefix,
            '## Available tools',
            ...tools.map(renderItem),
            guideline,
        ];
        return parts.join('\n\n');
    }

    return '';
}
