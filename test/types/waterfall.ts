import { AsyncSeriesWaterfallHook, SyncWaterfallHook } from '../../dist/index.js';

new SyncWaterfallHook<[number]>(['value']).call(1) satisfies number;
new AsyncSeriesWaterfallHook<[number]>(['value']).promise(1) satisfies Promise<number>;

type Result = number | void;
const sync = new SyncWaterfallHook<[number], Result>(['value']);
const asyncHook = new AsyncSeriesWaterfallHook<[number], Result>(['value']);
for (const hook of [sync, asyncHook]) {
  hook.tap('observe', (value) => {
    value satisfies number;
  });
  hook.tap('increment', (value) => value + 1);
  // @ts-expect-error The return type excludes string.
  hook.tap('invalid', () => 'text');
}
asyncHook.tapAsync('observe', (_value, callback) => callback());
asyncHook.tapPromise('observe', async () => {});
sync.call(1) satisfies Result;
asyncHook.promise(1) satisfies Promise<Result>;
