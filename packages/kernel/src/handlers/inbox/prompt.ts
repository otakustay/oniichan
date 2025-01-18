import {ToolDescription} from '@oniichan/shared/tool';
import systemPromptTemplate from './system.prompt';
import {renderPrompt} from '@oniichan/shared/prompt';

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
export function renderSystemPrompt(tools: ToolDescription[]) {
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

    return renderPrompt(systemPromptTemplate, view);
}
/* eslint-enable @typescript-eslint/no-unsafe-member-access */
