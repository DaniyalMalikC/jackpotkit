import { InvalidConfigurationError, InvalidSegmentError } from '../errors/index.js';
import {
  createValidationResult,
  type ValidationIssue,
  type ValidationResult,
} from '../validation/index.js';
import type { SpinWheelSelection, WheelSegment } from './types.js';

export function validateSpinWheelSegments(segments: readonly WheelSegment[]): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (segments.length === 0) {
    issues.push({
      code: 'EMPTY_SEGMENTS',
      message: 'Add at least one wheel segment.',
      path: ['segments'],
    });
  }

  const ids = new Set<string>();
  let totalWeight = 0;

  segments.forEach((segment, index) => {
    if (segment.id.trim().length === 0) {
      issues.push({
        code: 'EMPTY_SEGMENT_ID',
        message: 'Segment IDs must not be empty.',
        path: ['segments', index, 'id'],
      });
    } else if (ids.has(segment.id)) {
      issues.push({
        code: 'DUPLICATE_SEGMENT_ID',
        message: `Segment ID "${segment.id}" is duplicated.`,
        path: ['segments', index, 'id'],
      });
    }

    ids.add(segment.id);

    const weight = segment.weight ?? 1;
    if (!Number.isFinite(weight) || weight <= 0) {
      issues.push({
        code: 'INVALID_SEGMENT_WEIGHT',
        message: 'Segment weight must be a finite number greater than 0.',
        path: ['segments', index, 'weight'],
        metadata: { weight },
      });
    } else {
      totalWeight += weight;
    }
  });

  if (!Number.isFinite(totalWeight)) {
    issues.push({
      code: 'INVALID_TOTAL_WEIGHT',
      message: 'The sum of segment weights must be finite.',
      path: ['segments'],
    });
  }

  return createValidationResult(issues);
}

export function assertValidSpinWheelSegments(segments: readonly WheelSegment[]): void {
  const validation = validateSpinWheelSegments(segments);

  if (!validation.valid) {
    throw new InvalidConfigurationError(
      `Invalid Spin Wheel configuration. ${validation.issues
        .map((issue) => issue.message)
        .join(' ')}`,
      { metadata: { issues: validation.issues } },
    );
  }
}

export function validateSpinWheelSelection(
  segments: readonly WheelSegment[],
  selection: unknown,
): ValidationResult {
  if (
    typeof selection !== 'object' ||
    selection === null ||
    !('segmentId' in selection) ||
    typeof selection.segmentId !== 'string' ||
    selection.segmentId.trim().length === 0
  ) {
    return createValidationResult([
      {
        code: 'INVALID_SEGMENT_SELECTION',
        message: 'A Spin Wheel result must contain a non-empty segmentId.',
        path: ['segmentId'],
      },
    ]);
  }

  if (!segments.some((segment) => segment.id === selection.segmentId)) {
    return createValidationResult([
      {
        code: 'UNKNOWN_SEGMENT_ID',
        message: `No Spin Wheel segment has ID "${selection.segmentId}".`,
        path: ['segmentId'],
        metadata: { segmentId: selection.segmentId },
      },
    ]);
  }

  return createValidationResult([]);
}

export function assertValidSpinWheelSelection(
  segments: readonly WheelSegment[],
  selection: unknown,
): asserts selection is SpinWheelSelection {
  const validation = validateSpinWheelSelection(segments, selection);

  if (!validation.valid) {
    throw new InvalidSegmentError(
      `Invalid Spin Wheel result. ${validation.issues.map((issue) => issue.message).join(' ')}`,
      { metadata: { issues: validation.issues } },
    );
  }
}
