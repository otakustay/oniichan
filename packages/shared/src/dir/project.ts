import path from 'node:path';

export function projectConfig(...children: string[]) {
    return path.join('.oniichan', ...children);
}

export function projectCompiledConfig(...children: string[]) {
    return path.join('.oniichan', 'compiled', ...children);
}

export function projectRulesDirectory() {
    return projectConfig('rules');
}

export function projectRules(name: string) {
    const directory = projectRulesDirectory();
    return path.join(directory, `${name}.md`);
}
