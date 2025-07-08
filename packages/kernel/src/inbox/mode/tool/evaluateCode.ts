import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';
import {execaNode} from 'execa';
import type {EvaluateCodeParameter} from '@oniichan/shared/tool';
import {stringifyError} from '@oniichan/shared/error';
import type {RawToolCallParameter} from '@oniichan/shared/inbox';
import {tmpDirectory} from '@oniichan/shared/dir';
import {asString, resultMarkdown} from './utils';
import {ToolProviderBase} from './base';
import type {ToolExecuteResult} from './base';

export class EvaluateCodeToolImplement extends ToolProviderBase<EvaluateCodeParameter> {
    async executeApprove(args: EvaluateCodeParameter): Promise<ToolExecuteResult> {
        const result = await this.execute(args);
        return {
            type: 'success',
            finished: false,
            executionData: {result},
            template: '{{result}}',
        };
    }

    extractParameters(generated: Record<string, RawToolCallParameter>): Partial<EvaluateCodeParameter> {
        return {
            code: asString(generated.code, true),
            cwd: asString(generated.cwd, true),
        };
    }

    parseParameters(extracted: Partial<EvaluateCodeParameter>): EvaluateCodeParameter {
        return {
            code: extracted.code ?? '',
            cwd: extracted.cwd,
        };
    }

    private async execute({code, cwd}: EvaluateCodeParameter) {
        const directory = await tmpDirectory('run-code');

        if (!directory) {
            throw new Error('Failed to get temporary directory');
        }

        const file = path.join(directory, `${crypto.randomUUID()}.mjs`);
        try {
            const root = await this.editorHost.call('getWorkspaceRoot');
            await fs.writeFile(file, code.trim());

            const {stdout, stderr, exitCode} = await execaNode(
                file,
                {
                    cwd: cwd ?? root ?? process.cwd(),
                    reject: false,
                }
            );

            if (exitCode !== 0) {
                return resultMarkdown(
                    `Code execution failed with exit code ${code}`,
                    stderr
                );
            }

            return resultMarkdown(
                'Code execution succeeded',
                stdout || '(No output)'
            );
        }
        catch (error) {
            return `Code execution failed: ${stringifyError(error)}`;
        }
        finally {
            await fs.unlink(file).catch(() => {});
        }
    }
}
