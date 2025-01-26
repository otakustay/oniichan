import path from 'node:path';
import fs from 'node:fs/promises';
import {ToolDescription} from '@oniichan/shared/tool';
import systemPromptTemplate from './system.prompt';
import {renderPrompt} from '@oniichan/shared/prompt';
import {globalConfigDirectory} from '@oniichan/shared/dir';

async function readUserSystemPrompt() {
    const configDirectory = await globalConfigDirectory();

    if (!configDirectory) {
        return null;
    }

    try {
        return await fs.readFile(path.join(configDirectory, 'system-prompt.md'), 'utf-8');
    }
    catch {
        return null;
    }
}

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
export async function renderSystemPrompt(tools: ToolDescription[]) {
    const view: Record<string, any> = {
        tools: [],
    };
    for (const tool of tools) {
        const toolView: any = {
            name: tool.name,
            description: tool.description,
            parameters: [],
            usage: tool.usage,
        };
        for (const [name, definition] of Object.entries(tool.parameters.properties)) {
            const parameterView = {
                name,
                type: definition.type,
                description: definition.description ?? '',
                required: tool.parameters.required?.includes(name) ?? false,
            };
            toolView.parameters.push(parameterView);
        }
        view.tools.push(toolView);
    }

    const userSystemPrompt = await readUserSystemPrompt();
    return renderPrompt(userSystemPrompt ?? systemPromptTemplate, view);
}
/* eslint-enable @typescript-eslint/no-unsafe-member-access */
