import { GameStateError, InvalidConfigurationError } from '../errors/index.js';
import { MathRandomSource, nextRandomValue } from '../random/index.js';
import { resolveResult } from '../result/index.js';
import type {
  DiceEngine,
  DiceResult,
  DiceSelection,
  DieDefinition,
  CreateDiceOptions,
} from './types.js';
import {
  assertValidDiceDefinitions,
  assertValidDiceSelection,
  createDiceDefinitions,
} from './validation.js';

function copyDie(die: DieDefinition): DieDefinition {
  return Object.freeze({
    ...die,
    ...(die.metadata === undefined ? {} : { metadata: Object.freeze({ ...die.metadata }) }),
  });
}

export function createDice({
  dice: suppliedDice,
  count,
  sides,
  randomSource = new MathRandomSource(),
  now = Date.now,
}: CreateDiceOptions = {}): DiceEngine {
  if (suppliedDice !== undefined && (count !== undefined || sides !== undefined)) {
    throw new InvalidConfigurationError(
      'Provide either dice definitions or count and sides, not both.',
    );
  }
  const dice = Object.freeze(
    (suppliedDice ?? createDiceDefinitions(count ?? 1, sides ?? 6)).map(copyDie),
  );
  assertValidDiceDefinitions(dice);
  let status: DiceEngine['status'] = 'ready';
  let result: DiceResult | undefined;
  let playCount = 0;
  let operation = 0;
  let awaitingProvider = false;

  function assertCanRoll(): void {
    if (awaitingProvider) throw new GameStateError('Dice is already requesting a result.');
  }

  function complete(selection: DiceSelection): DiceResult {
    assertValidDiceSelection(dice, selection);
    const values = Object.freeze([...selection.values]);
    const total = values.reduce((sum, value) => sum + value, 0);
    playCount += 1;
    result = Object.freeze({
      id: `dice-${playCount}`,
      game: 'dice',
      data: Object.freeze({ values, total }),
      timestamp: now(),
      dice,
      values,
      total,
      ...(selection.metadata === undefined
        ? {}
        : { metadata: Object.freeze({ ...selection.metadata }) }),
    });
    status = 'completed';
    return result;
  }

  return {
    dice,
    get status() {
      return status;
    },
    get result() {
      return result;
    },
    roll() {
      assertCanRoll();
      status = 'playing';
      try {
        return complete({
          values: dice.map((die) => Math.floor(nextRandomValue(randomSource) * die.sides) + 1),
        });
      } catch (error) {
        status = 'error';
        throw error;
      }
    },
    rollTo(selection) {
      assertCanRoll();
      status = 'playing';
      try {
        return complete(selection);
      } catch (error) {
        status = 'error';
        throw error;
      }
    },
    async rollWith(provider, request) {
      assertCanRoll();
      awaitingProvider = true;
      status = 'requesting-result';
      const currentOperation = ++operation;
      try {
        const selection: unknown = await resolveResult(provider, request);
        if (currentOperation !== operation) {
          throw new GameStateError('Dice was reset before its result resolved.');
        }
        assertValidDiceSelection(dice, selection);
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
