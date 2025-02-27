import Ajv, {Schema, ValidateFunction} from 'ajv';
import {Logger} from '@oniichan/shared/logger';
import {assertNever, stringifyError} from '@oniichan/shared/error';
import {EditorHost} from '../../core/editor';
import {CommandExecutor} from '../../core/command';
import {ToolCallMessage, Workflow} from '../../inbox';

const ajv = new Ajv();

class ValidatorCache {
    private readonly cache = new Map<Schema, ValidateFunction>();

    getValidator(schema: Schema): ValidateFunction {
        const cached = this.cache.get(schema);

        if (cached) {
            return cached;
        }

        const validator = ajv.compile(schema);
        this.cache.set(schema, validator);

        return validator;
    }
}

const cache = new ValidatorCache();

interface ValidationSuccess<A> {
    type: 'valid';
    args: A;
}

interface MissingValidationError {
    type: 'missing';
    property: string;
}

interface TypeValidationError {
    type: 'type';
    property: string;
    expectedType: string;
}

interface UnknownValidationError {
    type: 'unknown';
    message: string;
}

type ValidationResult<A> = ValidationSuccess<A> | MissingValidationError | TypeValidationError | UnknownValidationError;

function validateArguments<A>(schema: Schema, args: Partial<A>): ValidationResult<A> {
    const validator = cache.getValidator(schema);
    const valid = validator(args);
    const error = validator.errors?.at(0);

    if (valid || !error) {
        return {
            type: 'valid',
            // Schema validation can hijack all property missing errors,
            // a valid arguments always satisfies the original type
            args: args as A,
        };
    }

    if (error.keyword === 'required') {
        return {
            type: 'missing',
            property: error.params.missingProperty,
        };
    }
    else if (error.keyword === 'type') {
        return {
            type: 'type',
            property: error.instancePath.slice(1),
            expectedType: error.params.type,
        };
    }

    return {
        type: 'unknown',
        message: ajv.errorsText(validator.errors),
    };
}

export interface StartToolRun {
    type: 'startToolRun';
}

export interface ValidateSuccess<A> {
    type: 'validateSuccess';
    args: A;
}

export interface ParameterMissingError {
    type: 'parameterMissing';
    parameter: string;
}

export interface ParameterTypeError {
    type: 'parameterType';
    parameter: string;
    expectedType: string;
}

export interface ValidationError {
    type: 'validationError';
    message: string;
}

export interface ExecuteError {
    type: 'executeError';
    output: string;
}

export interface RequireFix {
    type: 'requireFix';
    prompt: string;
    includesBase: boolean;
}

export interface RequireApprove {
    type: 'requireApprove';
}

export interface Success {
    type: 'success';
    finished: boolean;
    output: string;
}

export type ToolInputError = ParameterMissingError | ParameterTypeError | ValidationError;

export type ToolRunStep = StartToolRun | RequireApprove | Success | ExecuteError | RequireFix | ToolInputError;

export interface ToolImplementInit {
    origin: ToolCallMessage;
    workflow: Workflow;
    editorHost: EditorHost;
    logger: Logger;
    commandExecutor: CommandExecutor;
}

export abstract class ToolImplementBase<A extends Partial<Record<keyof A, any>> = Record<string, any>> {
    protected readonly origin: ToolCallMessage;

    protected readonly editorHost: EditorHost;

    protected readonly logger: Logger;

    protected readonly commandExecutor: CommandExecutor;

    private readonly schema: Schema;

    private arguments: A | null = null;

    constructor(className: string, init: ToolImplementInit, schema: Schema) {
        this.origin = init.origin;
        this.editorHost = init.editorHost;
        this.logger = init.logger.with({source: className});
        this.commandExecutor = init.commandExecutor;
        this.schema = schema;
    }

    async *run(generated: Record<string, string | undefined>): AsyncIterable<ToolRunStep> {
        // This method can be invoked either on initial generated or on user approved,
        // we have to parse and generated arguments on every run,
        // but we are sure that the validation must be successful after the first time
        if (!this.arguments) {
            const validationError = this.validate(generated);

            if (validationError) {
                yield validationError;
                return;
            }
        }

        const status = this.origin.getToolCallStatus();
        // It's actually a fragile self looping state machine :(
        switch (status) {
            case 'waitingValidate':
            case 'validateError':
                this.logger.error('ToolRunOnUnexpectedStatus', {messageUuid: this.origin.uuid, status});
                throw new Error('A tool in waiting validate state should never run');
            // From now on we expect `this.arguments` to be truthy
            case 'validated':
                yield* this.waitUserApprove(generated);
                break;
            case 'userApproved':
                yield {type: 'startToolRun'};
                yield this.execute();
                break;
            case 'waitingApprove':
            case 'generating':
            case 'userRejected':
            case 'executing':
            case 'completed':
            case 'failed':
                this.logger.warn('ToolRunOnInvalidStatus', {messageUuid: this.origin.uuid, status});
                return;
            default:
                assertNever<string>(status, v => `Unexpected tool call status ${v}`);
        }
    }

    async reject(): Promise<ToolRunStep> {
        try {
            const result = await this.userReject();
            return result;
        }
        catch (ex) {
            return {
                type: 'executeError',
                output: stringifyError(ex),
            };
        }
    }

    protected getToolCallArguments() {
        if (!this.arguments) {
            throw new Error('Tool call has not been validated');
        }

        return this.arguments;
    }

    protected requireUserApprove(): boolean {
        return false;
    }

    protected async userReject(): Promise<ToolRunStep> {
        throw new Error('This tool does not support reject');
    }

    protected abstract parseArgs(args: Record<string, string | undefined>): Partial<A>;

    protected abstract execute(): Promise<ToolRunStep>;

    private validate(generated: Record<string, string | undefined>): ToolInputError | null {
        const parsed = this.parseArgs(generated);
        const validateResult = validateArguments(this.schema, parsed);

        if (validateResult.type === 'valid') {
            this.arguments = validateResult.args;
            // This is called every time at any possible tool call status,
            // but we should avoid reverting status to `validated` after the first validation
            if (this.origin.getToolCallStatus() === 'waitingValidate') {
                this.origin.markToolCallStatus('validated');
            }
            return null;
        }

        this.origin.markToolCallStatus('validateError');

        switch (validateResult.type) {
            case 'missing':
                return {type: 'parameterMissing', parameter: validateResult.property};
            case 'type':
                return {
                    type: 'parameterType',
                    parameter: validateResult.property,
                    expectedType: validateResult.expectedType,
                };
            default:
                return {type: 'validationError', message: validateResult.message};
        }
    }

    private async *waitUserApprove(generated: Record<string, string | undefined>): AsyncIterable<ToolRunStep> {
        if (this.requireUserApprove()) {
            this.origin.markToolCallStatus('waitingApprove');
            yield {type: 'requireApprove'};
        }
        else {
            this.origin.markToolCallStatus('userApproved');
            yield* this.run(generated);
        }
    }
}

export function codeBlock(code: string, language = '') {
    return '```' + language + '\n' + code + '\n' + '```';
}

export function resultMarkdown(title: string, content: string, langauge = '') {
    return `${title}\n\n${codeBlock(content, langauge)}`;
}
