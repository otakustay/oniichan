import {InboxPromptView} from './interface';

const displayDescription =
    'nested directories can be merged into a single line containing `/`  directories end with `/`.';

const fullDescription =
    `This is a full structure of the project, you can inform these to narrow search scopes or read exact file from root directory. ${displayDescription}}`;

const truncatedDescription =
    `This project contains many directories and files, this is a part of them formed in a tree like structure, you can use this as a brief overview of project structure, you can read a directory to find a complete set of entries inside it. ${displayDescription}}`;

export function renderStructureSection(view: InboxPromptView) {
    const lines = [
        '## Project Structure',
        '',
        view.projectStructureTruncated ? truncatedDescription : fullDescription,
        '',
        view.projectStructure,
    ];
    return lines.join('\n');
}
