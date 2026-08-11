import { act, renderHook } from '@testing-library/react-native';

import { useDice } from './use-dice';

describe('useDice', () => {
  it('completes controlled rolls through the headless lifecycle', async () => {
    const events: string[] = [];
    const { result } = await renderHook(() =>
      useDice({
        count: 2,
        onEvent: (event) => events.push(event.type),
        result: { values: [2, 5] },
      }),
    );
    await act(async () => {
      await result.current.roll();
    });
    expect(result.current.result).toMatchObject({ total: 7, values: [2, 5] });
    expect(events).toEqual(['ready', 'play-start', 'result-resolved', 'complete']);
  });

  it('supports provider results, explicit rolls, and reset', async () => {
    const provider = jest.fn(async (campaign: string) => ({ values: [campaign.length] }));
    const { result } = await renderHook(() =>
      useDice({ resultProvider: provider, resultRequest: 'four', sides: 6 }),
    );
    await act(async () => {
      await result.current.roll();
    });
    expect(provider).toHaveBeenCalledWith('four');
    expect(result.current.result?.values).toEqual([4]);
    await act(async () => result.current.reset());
    await act(async () => {
      await result.current.rollTo({ values: [6] });
    });
    expect(result.current.result?.total).toBe(6);
  });
});
