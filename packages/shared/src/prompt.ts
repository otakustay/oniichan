import {render} from 'mustache';

export function renderPrompt(template: string, args: Record<string, unknown>) {
    const result = render(
        template,
        args,
        {},
        {
            escape: (v: string) => v,
        }
    );
    return result;
}
