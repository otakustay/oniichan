import {BrowserPreviewParameter} from '@oniichan/shared/tool';
import {ToolImplementBase, ToolExecuteResult} from './base';

export class BrowserPreviewToolImplement extends ToolImplementBase<BrowserPreviewParameter> {
    async executeApprove(args: BrowserPreviewParameter): Promise<ToolExecuteResult> {
        const response = await fetch(args.url);

        if (response.ok) {
            return {
                type: 'success',
                finished: false,
                output: 'User is glad to see the preview in browser, you can continue your work.',
            };
        }

        return {
            type: 'success',
            finished: false,
            output: `This URL is not accessible for now, but its not a big problem, you can continue your work.`,
        };
    }

    extractParameters(generated: Record<string, string | undefined>): Partial<BrowserPreviewParameter> {
        return {
            url: generated.url?.trim(),
        };
    }
}
