import Ajv, {Schema, ValidateFunction} from 'ajv';
import {EditorHost} from '../../editor';

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

interface ValidationSuccess {
    type: 'valid';
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

type ValidationResult = ValidationSuccess | MissingValidationError | TypeValidationError | UnknownValidationError;

function validateArguments(schema: Schema, args: Record<string, unknown>): ValidationResult {
    const validator = cache.getValidator(schema);
    const valid = validator(args);
    const error = validator.errors?.at(0);

    if (valid || !error) {
        return {type: 'valid'};
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

function errorMissingParameter(name: string) {
    return `Missing value for required parameter "${name}", this may be caused by empty content in <${name}> tag or missing <${name}> tag, please retry with complete response.`;
}

function errorParameterType(name: string, expectedType: string) {
    return `Parameter "${name}" is not of type ${expectedType}, please retry with correct response.`;
}

function errorUnknown(message: string) {
    return `Parameters have unknown error: ${message}, please retry with correct response.`;
}

export abstract class ToolImplementBase<A extends Partial<Record<keyof A, any>> = Record<string, any>> {
    protected readonly editorHost: EditorHost;

    private readonly schema: Schema;

    constructor(editorHost: EditorHost, schema: Schema) {
        this.editorHost = editorHost;
        this.schema = schema;
    }

    async run(generated: Record<string, string>): Promise<string> {
        const parsed = this.parseArgs(generated);
        const validateResult = validateArguments(this.schema, parsed);

        if (validateResult.type === 'valid') {
            return this.execute(parsed);
        }

        switch (validateResult.type) {
            case 'missing':
                return errorMissingParameter(validateResult.property);
            case 'type':
                return errorParameterType(validateResult.property, validateResult.expectedType);
            default:
                return errorUnknown(validateResult.message);
        }
    }

    protected abstract parseArgs(args: Record<string, string>): A;

    protected abstract execute(args: A): Promise<string>;
}

export function codeBlock(code: string, language = '') {
    return '```' + language + '\n' + code + '\n' + '```';
}

export function resultMarkdown(title: string, content: string, langauge = '') {
    return `${title}\n\n${codeBlock(content, langauge)}`;
}
