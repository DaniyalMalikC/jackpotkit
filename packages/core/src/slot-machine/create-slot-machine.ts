import { GameStateError } from '../errors/index.js';
import { MathRandomSource } from '../random/index.js';
import { resolveResult } from '../result/index.js';
import { evaluateSlotPaylines } from './evaluation.js';
import { createRandomSlotSelection } from './selection.js';
import type {
  CreateSlotMachineOptions,
  SlotEvaluationContext,
  SlotMachineEngine,
  SlotMachineResult,
  SlotMachineSelection,
  SlotSymbol,
} from './types.js';
import {
  assertValidSlotMachineConfiguration,
  assertValidSlotMachineSelection,
  assertValidSlotSymbols,
  createDefaultSlotPaylines,
} from './validation.js';

function copySymbol<TValue>(symbol: SlotSymbol<TValue>): SlotSymbol<TValue> {
  return Object.freeze({
    ...symbol,
    ...(symbol.metadata === undefined ? {} : { metadata: Object.freeze({ ...symbol.metadata }) }),
  });
}

export function createSlotMachine<TValue = unknown, TEvaluation = unknown>({
  symbols: suppliedSymbols,
  reelCount,
  rowCount = 3,
  paylines: suppliedPaylines = createDefaultSlotPaylines(reelCount, rowCount),
  randomSource = new MathRandomSource(),
  evaluate,
  now = Date.now,
}: CreateSlotMachineOptions<TValue, TEvaluation>): SlotMachineEngine<TValue, TEvaluation> {
  assertValidSlotSymbols(suppliedSymbols);
  assertValidSlotMachineConfiguration({ reelCount, rowCount, paylines: suppliedPaylines });

  const symbols = Object.freeze(suppliedSymbols.map(copySymbol));
  const symbolById = new Map(symbols.map((symbol) => [symbol.id, symbol]));
  const paylines = Object.freeze(suppliedPaylines.map((payline) => Object.freeze([...payline])));
  let status: SlotMachineEngine<TValue, TEvaluation>['status'] = 'ready';
  let result: SlotMachineResult<TValue, TEvaluation> | undefined;
  let playCount = 0;
  let operation = 0;
  let awaitingProvider = false;

  function assertCanPlay(): void {
    if (awaitingProvider) {
      throw new GameStateError('The Slot Machine is already requesting a result.');
    }
  }

  function complete(selection: SlotMachineSelection): SlotMachineResult<TValue, TEvaluation> {
    assertValidSlotMachineSelection(symbols, reelCount, rowCount, selection);
    const reelIds = Object.freeze(selection.reels.map((reel) => Object.freeze([...reel])));
    const reels = Object.freeze(
      reelIds.map((reel) =>
        Object.freeze(reel.map((symbolId) => symbolById.get(symbolId) as SlotSymbol<TValue>)),
      ),
    );
    const winningPaylines = evaluateSlotPaylines(reels, paylines);
    const context: SlotEvaluationContext<TValue> = Object.freeze({
      paylines,
      reels,
      winningPaylines,
    });
    const evaluation = evaluate?.(context);
    const winningPaylineIndexes = Object.freeze(winningPaylines.map((winner) => winner.index));
    const data = Object.freeze({
      reels: reelIds,
      winningPaylineIndexes,
      ...(evaluation === undefined ? {} : { evaluation }),
    });
    playCount += 1;

    result = Object.freeze({
      id: `slot-machine-${playCount}`,
      game: 'slot-machine',
      data,
      timestamp: now(),
      reels,
      winningPaylines,
      ...(evaluation === undefined ? {} : { evaluation }),
      ...(selection.metadata === undefined
        ? {}
        : { metadata: Object.freeze({ ...selection.metadata }) }),
    });
    status = 'completed';
    return result;
  }

  return {
    symbols,
    reelCount,
    rowCount,
    paylines,
    get status() {
      return status;
    },
    get result() {
      return result;
    },
    spin() {
      assertCanPlay();
      status = 'playing';
      try {
        return complete(createRandomSlotSelection(symbols, reelCount, rowCount, randomSource));
      } catch (error) {
        status = 'error';
        throw error;
      }
    },
    spinTo(selection) {
      assertCanPlay();
      status = 'playing';
      try {
        return complete(selection);
      } catch (error) {
        status = 'error';
        throw error;
      }
    },
    async spinWith(provider, request) {
      assertCanPlay();
      awaitingProvider = true;
      status = 'requesting-result';
      const currentOperation = ++operation;

      try {
        const selection: unknown = await resolveResult(provider, request);
        if (currentOperation !== operation) {
          throw new GameStateError('The Slot Machine was reset before its result resolved.');
        }
        assertValidSlotMachineSelection(symbols, reelCount, rowCount, selection);
        status = 'playing';
        return complete(selection);
      } catch (error) {
        if (currentOperation === operation) status = 'error';
        throw error;
      } finally {
        if (currentOperation === operation) awaitingProvider = false;
      }
    },
    reset() {
      operation += 1;
      awaitingProvider = false;
      result = undefined;
      status = 'ready';
    },
  };
}
