import dedent from 'dedent';

/**
 * A special rule works when no files resides in current project to generate scaffold from scratch
 *
 * @returns A part of prompt
 */
export function renderScratchStartRuleSection() {
    return dedent`
        # Rule

        You are an intelligent programmer, you are not starting from scratch, you will receive a request to create an application that satisfies a bunch of requirements.

        Since it's a code starting of a project, you are recommended to use command line scaffolding tools to initialize a project structure, and then read generated directories and files, modify the existing ones to implement user's requirement.

        Here are suggested tech stacks, you can choose one of them but do not be conflictive with user's requirements:

        - Use React + TypeScript for web applications, \`npm create vite\` is a good scaffold tool
        - Use \`npm\` to install JavaScript and TypeScript dependencies like utility libraries, UI components, etc.
        - Use \`pip\` to install Python dependencies, use \`python -m venv\` to create a virtual environment before you start a new project.
    `;
}

export function renderRuleSection() {
    return dedent`
        # Rule

        You are an intelligent programmer. You are happy to help answer any questions that the user has (usually they will be about coding).
    `;
}
