import { GameStateError, InvalidConfigurationError, InvalidResultError } from '../errors/index.js';
import type { LuckyBoxItem, LuckyBoxSelection } from './types.js';

export function assertValidLuckyBoxes<TReward>(boxes: readonly LuckyBoxItem<TReward>[]): void {
  if (!Array.isArray(boxes) || boxes.length === 0) {
    throw new InvalidConfigurationError('Lucky Box requires at least one box.');
  }
  const ids = new Set<string>();
  let enabledCount = 0;
  for (const [index, box] of boxes.entries()) {
    if (typeof box?.id !== 'string' || box.id.trim().length === 0) {
      throw new InvalidConfigurationError(`Lucky Box item ${index + 1} must have a non-empty ID.`);
    }
    if (ids.has(box.id)) {
      throw new InvalidConfigurationError(`Lucky Box contains duplicate box ID "${box.id}".`);
    }
    if (box.disabled !== true) enabledCount += 1;
    ids.add(box.id);
  }
  if (enabledCount === 0) {
    throw new InvalidConfigurationError('Lucky Box requires at least one enabled box.');
  }
}

export function assertSelectableLuckyBox<TReward>(
  boxes: readonly LuckyBoxItem<TReward>[],
  boxId: string,
): LuckyBoxItem<TReward> {
  if (typeof boxId !== 'string' || boxId.trim().length === 0) {
    throw new InvalidResultError('Lucky Box requires a non-empty box ID.');
  }
  const box = boxes.find((candidate) => candidate.id === boxId);
  if (box === undefined) throw new InvalidResultError(`Unknown Lucky Box ID "${boxId}".`);
  if (box.disabled === true) throw new GameStateError(`Lucky Box "${boxId}" is disabled.`);
  return box;
}

export function assertValidLuckyBoxSelection<TReward>(
  boxes: readonly LuckyBoxItem<TReward>[],
  selection: unknown,
): asserts selection is LuckyBoxSelection {
  if (
    typeof selection !== 'object' ||
    selection === null ||
    !('boxId' in selection) ||
    typeof selection.boxId !== 'string'
  ) {
    throw new InvalidResultError('A Lucky Box selection must contain a boxId string.');
  }
  assertSelectableLuckyBox(boxes, selection.boxId);
  if (
    'metadata' in selection &&
    selection.metadata !== undefined &&
    (typeof selection.metadata !== 'object' || selection.metadata === null)
  ) {
    throw new InvalidResultError('Lucky Box result metadata must be an object when supplied.');
  }
}
