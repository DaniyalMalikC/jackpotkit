import { InvalidConfigurationError, InvalidResultError } from '../errors/index.js';

export type ValidationPathSegment = string | number;

export interface ValidationIssue {
  readonly code: string;
  readonly message: string;
  readonly path?: readonly ValidationPathSegment[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface ValidationSuccess {
  readonly valid: true;
  readonly issues: readonly [];
}

export interface ValidationFailure {
  readonly valid: false;
  readonly issues: readonly [ValidationIssue, ...ValidationIssue[]];
}

export type ValidationResult = ValidationSuccess | ValidationFailure;

const VALIDATION_SUCCESS: ValidationSuccess = Object.freeze({
  valid: true,
  issues: Object.freeze([] as const),
});

function freezeIssue(issue: ValidationIssue): ValidationIssue {
  return Object.freeze({
    code: issue.code,
    message: issue.message,
    ...(issue.path === undefined ? {} : { path: Object.freeze([...issue.path]) }),
    ...(issue.metadata === undefined ? {} : { metadata: Object.freeze({ ...issue.metadata }) }),
  });
}

export function createValidationResult(issues: readonly ValidationIssue[]): ValidationResult {
  if (issues.length === 0) {
    return VALIDATION_SUCCESS;
  }

  const frozenIssues = issues.map(freezeIssue) as [ValidationIssue, ...ValidationIssue[]];

  return Object.freeze({
    valid: false,
    issues: Object.freeze(frozenIssues),
  });
}

function formatPath(path: readonly ValidationPathSegment[]): string {
  return path.reduce<string>((formatted, segment) => {
    if (typeof segment === 'number') {
      return `${formatted}[${segment}]`;
    }

    return formatted.length === 0 ? segment : `${formatted}.${segment}`;
  }, '');
}

function formatIssues(issues: readonly ValidationIssue[]): string {
  return issues
    .map((issue) => {
      if (issue.path === undefined || issue.path.length === 0) {
        return issue.message;
      }

      return `${formatPath(issue.path)}: ${issue.message}`;
    })
    .join('; ');
}

export function assertValidConfiguration(
  result: ValidationResult,
  message = 'Invalid configuration.',
): asserts result is ValidationSuccess {
  if (!result.valid) {
    throw new InvalidConfigurationError(`${message} ${formatIssues(result.issues)}`, {
      metadata: { issues: result.issues },
    });
  }
}

export function assertValidResult(
  result: ValidationResult,
  message = 'Invalid result.',
): asserts result is ValidationSuccess {
  if (!result.valid) {
    throw new InvalidResultError(`${message} ${formatIssues(result.issues)}`, {
      metadata: { issues: result.issues },
    });
  }
}
