import type {BrowserPreviewParameter} from '@oniichan/shared/tool';
import type {RawToolCallParameter} from '@oniichan/shared/inbox';
import {ToolProviderBase} from './base.js';
import type {ToolExecuteResult} from './base.js';
import {asString} from './utils.js';

export class BrowserPreviewToolImplement extends ToolProviderBase<BrowserPreviewParameter> {
    async executeApprove(args: BrowserPreviewParameter): Promise<ToolExecuteResult> {
        const response = await fetch(args.url);

        if (response.ok) {
            return {
                type: 'success',
                finished: false,
                executionData: {statusCode: response.status},
                template: 'User is glad to see the preview in browser, you can continue your work.',
            };
        }

        return {
            type: 'success',
            finished: false,
            executionData: {},
            template: `This URL is not accessible for now, but its not a big problem, you can continue your work.`,
        };
    }

    extractParameters(generated: Record<string, RawToolCallParameter>): Partial<BrowserPreviewParameter> {
        return {
            url: asString(generated.url, true),
        };
    }

    parseParameters(extracted: Partial<BrowserPreviewParameter>): BrowserPreviewParameter {
        return {
            url: extracted.url ?? '',
        };
    }
}
