import { AsyncSeriesWaterfallHook, SyncWaterfallHook } from '../../dist/index.js';

function expectType<T>(_value: T): void {}

const defaultSync = new SyncWaterfallHook<[number]>(['value']);
defaultSync.tap('increment', (value) => value + 1);
expectType<number>(defaultSync.call(1));
// @ts-expect-error The default return type remains the first argument type.
defaultSync.tap('invalid', () => 'text');

const defaultAsync = new AsyncSeriesWaterfallHook<[number]>(['value']);
defaultAsync.tapPromise('increment', async (value) => value + 1);
expectType<Promise<number>>(defaultAsync.promise(1));
// @ts-expect-error The default return type remains the first argument type.
defaultAsync.tapPromise('invalid', async () => 'text');

const sync = new SyncWaterfallHook<[number], string>(['value']);
sync.tap('stringify', (value) => {
  expectType<number>(value);
  return String(value);
});
expectType<string>(sync.call(1));
expectType<string>(sync.callStageRange(sync.queryStageRange([0, 10]), 1));
expectType<string>(sync.queryStageRange([0, 10]).call(1));
sync.callAsync(1, (_error, result) => expectType<string | undefined>(result));
sync.callAsyncStageRange(sync.queryStageRange([0, 10]), 1, (_error, result) => {
  expectType<string | undefined>(result);
});
sync.intercept({ result: (result) => expectType<string>(result) });
sync.withOptions({ stage: 1 }).tap('stringify', (value) => String(value));
// @ts-expect-error An explicit result type must be respected.
sync.tap('invalid', (value) => value);
// @ts-expect-error Input arguments keep their original type.
sync.call('text');

const asyncHook = new AsyncSeriesWaterfallHook<[number], string>(['value']);
asyncHook.tap('stringify', (value) => {
  expectType<number>(value);
  return String(value);
});
asyncHook.tapAsync('stringify', (value, callback) => {
  expectType<number>(value);
  callback(null, String(value));
  // @ts-expect-error The callback result uses the explicit return type.
  callback(null, value);
});
asyncHook.tapPromise('stringify', async (value) => String(value));
expectType<Promise<string>>(asyncHook.promise(1));
expectType<Promise<string>>(asyncHook.queryStageRange([0, 10]).promise(1));
expectType<Promise<string>>(
  asyncHook.promiseStageRange(asyncHook.queryStageRange([0, 10]), 1),
);
asyncHook.callAsync(1, (_error, result) => expectType<string | undefined>(result));
asyncHook.callAsyncStageRange(
  asyncHook.queryStageRange([0, 10]),
  1,
  (_error, result) => expectType<string | undefined>(result),
);
asyncHook.intercept({ result: (result) => expectType<string>(result) });
asyncHook.withOptions({ stage: 1 }).tapPromise('stringify', async (value) =>
  String(value),
);
// @ts-expect-error An explicit result type must be respected.
asyncHook.tapPromise('invalid', async (value) => value);
// @ts-expect-error Input arguments keep their original type.
asyncHook.promise('text');

type Data = { resource: string };
type Result = Data | false | void;
const optionalSync = new SyncWaterfallHook<[Data | false], Result>(['data']);
const optionalAsync = new AsyncSeriesWaterfallHook<[Data | false], Result>([
  'data',
]);
for (const hook of [optionalSync, optionalAsync]) {
  hook.tap('mutate', (data) => {
    if (data === false) return false;
    data.resource = '/new/path';
  });
  hook.tap('observe', () => {});
}
optionalAsync.tapPromise('mutate', async (data) => {
  if (data === false) return false;
  data.resource = '/new/path';
});
expectType<Result>(optionalSync.call(false));
expectType<Promise<Result>>(optionalAsync.promise(false));

type CustomOptions = { label: string };
const customSync = new SyncWaterfallHook<[number], string, CustomOptions>([
  'value',
]);
const customAsync = new AsyncSeriesWaterfallHook<[number], string, CustomOptions>([
  'value',
]);
for (const hook of [customSync, customAsync]) {
  hook.tap({ name: 'stringify', label: 'custom' }, (value) => String(value));
  hook.intercept({ tap: (tap) => expectType<string>(tap.label) });
  // @ts-expect-error Additional tap options belong to the third generic.
  hook.tap({ name: 'missing-label' }, (value) => String(value));
}
