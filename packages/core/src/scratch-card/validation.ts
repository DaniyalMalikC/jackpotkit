import { InvalidConfigurationError, InvalidResultError } from '../errors/index.js';
import { createValidationResult, type ValidationResult } from '../validation/index.js';
import type { ScratchCardConfiguration, ScratchCardSelection, ScratchPoint } from './types.js';

function validatePositiveFinite(
  value: number | undefined,
  path: string,
  issues: { code: string; message: string; path: readonly string[] }[],
): void {
  if (value !== undefined && (!Number.isFinite(value) || value <= 0)) {
    issues.push({
      code: 'invalid-dimension',
      message: `${path} must be a positive finite number.`,
      path: [path],
    });
  }
}

export function validateScratchCardConfiguration(
  configuration: ScratchCardConfiguration,
): ValidationResult {
  const issues: { code: string; message: string; path: readonly string[] }[] = [];
  const threshold = configuration.threshold ?? 0.65;

  if (!Number.isFinite(threshold) || threshold <= 0 || threshold > 1) {
    issues.push({
      code: 'invalid-threshold',
      message: 'threshold must be greater than 0 and less than or equal to 1.',
      path: ['threshold'],
    });
  }

  validatePositiveFinite(configuration.width, 'width', issues);
  validatePositiveFinite(configuration.height, 'height', issues);
  validatePositiveFinite(configuration.brushRadius, 'brushRadius', issues);
  validatePositiveFinite(configuration.cellSize, 'cellSize', issues);

  return createValidationResult(issues);
}

export function assertValidScratchCardConfiguration(configuration: ScratchCardConfiguration): void {
  const validation = validateScratchCardConfiguration(configuration);

  if (!validation.valid) {
    throw new InvalidConfigurationError(validation.issues[0]?.message ?? 'Invalid Scratch Card.');
  }
}

export function assertValidScratchCardSelection<TPrize>(
  selection: unknown,
): asserts selection is ScratchCardSelection<TPrize> {
  if (selection === null || typeof selection !== 'object' || Array.isArray(selection)) {
    throw new InvalidResultError('A Scratch Card result must be an object.');
  }

  const metadata = (selection as { metadata?: unknown }).metadata;
  if (metadata !== undefined && (metadata === null || typeof metadata !== 'object')) {
    throw new InvalidResultError('Scratch Card result metadata must be an object when supplied.');
  }
}

export function assertValidScratchProgress(progress: number): void {
  if (!Number.isFinite(progress) || progress < 0 || progress > 1) {
    throw new InvalidConfigurationError('Scratch Card progress must be between 0 and 1.');
  }
}

export function assertValidScratchPoint(point: ScratchPoint, path = 'point'): void {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    throw new InvalidConfigurationError(`${path} must contain finite x and y coordinates.`);
  }
}
