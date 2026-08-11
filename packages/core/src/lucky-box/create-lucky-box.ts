import { GameStateError } from '../errors/index.js';
import { MathRandomSource, nextRandomValue } from '../random/index.js';
import { resolveResult } from '../result/index.js';
import type {
  CreateLuckyBoxOptions,
  LuckyBoxEngine,
  LuckyBoxItem,
  LuckyBoxResult,
  LuckyBoxSelection,
  LuckyBoxState,
} from './types.js';
import {
  assertSelectableLuckyBox,
  assertValidLuckyBoxes,
  assertValidLuckyBoxSelection,
} from './validation.js';

function copyBox<TReward>(box: LuckyBoxItem<TReward>): LuckyBoxItem<TReward> {
  return Object.freeze({
    ...box,
    ...(box.metadata === undefined ? {} : { metadata: Object.freeze({ ...box.metadata }) }),
  });
}

export function createLuckyBox<TReward = unknown>({
  boxes: suppliedBoxes,
  randomSource = new MathRandomSource(),
  now = Date.now,
}: CreateLuckyBoxOptions<TReward>): LuckyBoxEngine<TReward> {
  assertValidLuckyBoxes(suppliedBoxes);
  const boxes = Object.freeze(suppliedBoxes.map(copyBox));
  const enabledBoxes = boxes.filter((box) => box.disabled !== true);
  let status: LuckyBoxEngine<TReward>['status'] = 'ready';
  let selectedBox: LuckyBoxItem<TReward> | undefined;
  let result: LuckyBoxResult<TReward> | undefined;
  let state: LuckyBoxState;
  let playCount = 0;
  let operation = 0;
  let awaitingProvider = false;

  function snapshot(): LuckyBoxState {
    return Object.freeze({
      status,
      selectedBoxId: selectedBox?.id,
      revealed: result !== undefined,
    });
  }

  function assertCanReveal(): LuckyBoxItem<TReward> {
    if (awaitingProvider) throw new GameStateError('Lucky Box is already requesting a result.');
    if (result !== undefined) throw new GameStateError('Reset Lucky Box before revealing again.');
    if (selectedBox === undefined) throw new GameStateError('Select a Lucky Box before revealing.');
    return selectedBox;
  }

  function complete(selection: LuckyBoxSelection): LuckyBoxResult<TReward> {
    const currentSelectedBox = assertCanReveal();
    assertValidLuckyBoxSelection(boxes, selection);
    const winningBox = assertSelectableLuckyBox(boxes, selection.boxId);
    const won = currentSelectedBox.id === winningBox.id;
    const reward = won ? winningBox.reward : undefined;
    const data = Object.freeze({
      selectedBoxId: currentSelectedBox.id,
      winningBoxId: winningBox.id,
      won,
      ...(reward === undefined ? {} : { reward }),
    });
    playCount += 1;
    result = Object.freeze({
      id: `lucky-box-${playCount}`,
      game: 'lucky-box',
      data,
      timestamp: now(),
      selectedBox: currentSelectedBox,
      winningBox,
      won,
      ...(reward === undefined ? {} : { reward }),
      ...(selection.metadata === undefined
        ? {}
        : { metadata: Object.freeze({ ...selection.metadata }) }),
    });
    status = 'completed';
    state = snapshot();
    return result;
  }

  state = snapshot();

  return {
    boxes,
    get state() {
      return state;
    },
    get status() {
      return status;
    },
    get result() {
      return result;
    },
    select(boxId) {
      if (awaitingProvider) throw new GameStateError('Lucky Box is already requesting a result.');
      if (result !== undefined) throw new GameStateError('Reset Lucky Box before selecting again.');
      selectedBox = assertSelectableLuckyBox(boxes, boxId);
      status = 'playing';
      state = snapshot();
      return state;
    },
    reveal() {
      assertCanReveal();
      status = 'revealing';
      try {
        const index = Math.floor(nextRandomValue(randomSource) * enabledBoxes.length);
        return complete({ boxId: (enabledBoxes[index] as LuckyBoxItem<TReward>).id });
      } catch (error) {
        status = 'error';
        state = snapshot();
        throw error;
      }
    },
    revealTo(selection) {
      assertCanReveal();
      status = 'revealing';
      try {
        return complete(selection);
      } catch (error) {
        status = 'error';
        state = snapshot();
        throw error;
      }
    },
    async revealWith(provider, request) {
      assertCanReveal();
      awaitingProvider = true;
      status = 'requesting-result';
      state = snapshot();
      const currentOperation = ++operation;
      try {
        const selection: unknown = await resolveResult(provider, request);
        if (currentOperation !== operation) {
          throw new GameStateError('Lucky Box was reset before its result resolved.');
        }
        assertValidLuckyBoxSelection(boxes, selection);
        awaitingProvider = false;
        status = 'revealing';
        return complete(selection);
      } catch (error) {
        if (currentOperation === operation) {
          status = 'error';
          state = snapshot();
        }
        throw error;
      } finally {
        if (currentOperation === operation) awaitingProvider = false;
      }
    },
    reset() {
      operation += 1;
      awaitingProvider = false;
      selectedBox = undefined;
      result = undefined;
      status = 'ready';
      state = snapshot();
      return state;
    },
  };
}
