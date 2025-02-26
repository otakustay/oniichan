import {browserPreviewParameters, BrowserPreviewParameter} from '@oniichan/shared/tool';
import {ToolImplementBase, ToolImplementInit, ToolRunStep} from './utils';

export class BrowserPreviewToolImplement extends ToolImplementBase<BrowserPreviewParameter> {
    constructor(init: ToolImplementInit) {
        super('BrowserPreviewToolImplement', init, browserPreviewParameters);
    }

    protected parseArgs(args: Record<string, string | undefined>) {
        return {
            url: args.url,
        };
    }

    protected async execute(): Promise<ToolRunStep> {
        const args = this.getToolCallArguments();
        const response = await fetch(args.url);

        if (response.ok) {
            return {
                type: 'success',
                finished: false,
                output: 'User is glad to see the preview in browser, you can continue your work',
            };
        }

        return {
            type: 'success',
            finished: false,
            output: `This URL is not accessible for now, but its not a big problem, you can continue your work`,
        };
    }
}
