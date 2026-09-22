import { AsyncSeriesWaterfallHook, SyncWaterfallHook } from '../../dist/index.js';

function expectType<T>(_value: T): void {}

// Omitting R preserves the first argument's type.
const defaultSync = new SyncWaterfallHook<[number]>(['value']);
const defaultAsync = new AsyncSeriesWaterfallHook<[number]>(['value']);
for (const hook of [defaultSync, defaultAsync]) {
  hook.tap('increment', (value) => value + 1);
  // @ts-expect-error The default return type is number.
  hook.tap('invalid', () => 'text');
}
expectType<number>(defaultSync.call(1));
expectType<Promise<number>>(defaultAsync.promise(1));

// Explicit R permits void without widening the input type.
type Result = number | false | void;
const sync = new SyncWaterfallHook<[number | false], Result>(['value']);
const asyncHook = new AsyncSeriesWaterfallHook<[number | false], Result>([
  'value',
]);
for (const hook of [sync, asyncHook]) {
  hook.tap('observe', (value) => {
    expectType<number | false>(value);
  });
  hook.tap('cancel', () => false);
  // @ts-expect-error The explicit return type excludes string.
  hook.tap('invalid', () => 'text');
}
asyncHook.tapAsync('observe', (_value, callback) => {
  callback();
  // @ts-expect-error The callback must respect R.
  callback(null, 'text');
});
asyncHook.tapPromise('observe', async () => {});
// @ts-expect-error Promise results must respect R.
asyncHook.tapPromise('invalid', async () => 'text');
expectType<Result>(sync.call(1));
expectType<Result>(sync.queryStageRange([0, Infinity]).call(1));
expectType<Promise<Result>>(asyncHook.promise(1));
expectType<Promise<Result>>(asyncHook.queryStageRange([0, Infinity]).promise(1));

// Additional tap options move to the third generic.
type CustomOptions = { label: string };
const customSync = new SyncWaterfallHook<[number], number, CustomOptions>([
  'value',
]);
const customAsync = new AsyncSeriesWaterfallHook<[number], number, CustomOptions>([
  'value',
]);
for (const hook of [customSync, customAsync]) {
  hook.tap({ name: 'increment', label: 'custom' }, (value) => value + 1);
  // @ts-expect-error The required custom option is missing.
  hook.tap({ name: 'invalid' }, (value) => value);
}
