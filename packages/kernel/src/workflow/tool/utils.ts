import Ajv, {Schema, ValidateFunction} from 'ajv';
import {Logger} from '@oniichan/shared/logger';
import {EditorHost} from '../../editor';
import {CommandExecutor} from '../../core/command';
import {ToolCallMessage} from '../../inbox';

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

export interface Success {
    type: 'success';
    finished: boolean;
    output: string;
}

export type ToolInputError = ParameterMissingError | ParameterTypeError | ValidationError;

export type ToolRunResult = Success | ExecuteError | RequireFix | ToolInputError;

export function isToolInputError(result: ToolRunResult): result is ToolInputError {
    return result.type === 'parameterMissing' || result.type === 'parameterType' || result.type === 'validationError';
}

export interface ToolImplementInit {
    origin: ToolCallMessage;
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

    constructor(className: string, init: ToolImplementInit, schema: Schema) {
        this.origin = init.origin;
        this.editorHost = init.editorHost;
        this.logger = init.logger.with({source: className});
        this.commandExecutor = init.commandExecutor;
        this.schema = schema;
    }

    async run(generated: Record<string, string | undefined>): Promise<ToolRunResult> {
        const parsed = this.parseArgs(generated);
        const validateResult = validateArguments(this.schema, parsed);

        if (validateResult.type === 'valid') {
            return this.execute(validateResult.args);
        }

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

    protected abstract parseArgs(args: Record<string, string | undefined>): Partial<A>;

    protected abstract execute(args: A): Promise<ToolRunResult>;
}

export function codeBlock(code: string, language = '') {
    return '```' + language + '\n' + code + '\n' + '```';
}

export function resultMarkdown(title: string, content: string, langauge = '') {
    return `${title}\n\n${codeBlock(content, langauge)}`;
}
