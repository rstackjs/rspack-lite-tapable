/**
 * The following code is modified based on
 * https://github.com/webpack/tapable/blob/a0a7b26/lib/__tests__/AsyncSeriesHooks.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */

"use strict";

const HookTester = require("./HookTester.cjs");
const {
	AsyncSeriesHook,
	AsyncSeriesBailHook,
	AsyncSeriesWaterfallHook
} = require("../");

describe("AsyncSeriesHook", () => {
	it("should not have call method", () => {
		const hook = new AsyncSeriesHook([]);
		expect(hook.call).toEqual(undefined);
		expect(typeof hook.callAsync).toEqual("function");
		expect(typeof hook.promise).toEqual("function");
	});

	it("should have tap method", async () => {
		const hook = new AsyncSeriesHook([]);
		const mockTap = rstest.fn();
		hook.tap("somePlugin", mockTap);

		await new Promise((resolve) => {
			hook.callAsync(() => resolve());
		});
		expect(mockTap).toHaveBeenCalledTimes(1);
	});

	it("should have promise method", async () => {
		const hook = new AsyncSeriesHook([]);
		const mockTap = rstest.fn();
		hook.tap("somePlugin", mockTap);
		await hook.promise();
		expect(mockTap).toHaveBeenCalledTimes(1);
	});

	it("should have to correct behavior", async () => {
		const tester = new HookTester(args => new AsyncSeriesHook(args));

		const result = await tester.run();

		expect(result).toMatchSnapshot();
	});
});

describe("AsyncSeriesBailHook", () => {
	it("should have to correct behavior", async () => {
		const tester = new HookTester(args => new AsyncSeriesBailHook(args));

		const result = await tester.run();

		expect(result).toMatchSnapshot();
	});

	it("should not crash with many plugins", () => {
		const hook = new AsyncSeriesBailHook(["x"]);
		for (let i = 0; i < 1000; i++) {
			hook.tap("Test", () => 42);
		}
		hook.tapAsync("Test", (x, callback) => callback(null, 42));
		hook.tapPromise("Test", x => Promise.resolve(42));
		return expect(hook.promise()).resolves.toBe(42);
	});
});

describe("AsyncSeriesWaterfallHook", () => {
	it("should have to correct behavior", async () => {
		const tester = new HookTester(args => new AsyncSeriesWaterfallHook(args));

		const result = await tester.run();

		expect(result).toMatchSnapshot();
	});
});

// describe("AsyncSeriesLoopHook", () => {
// 	it("should have to correct behavior", async () => {
// 		const tester = new HookTester(args => new AsyncSeriesLoopHook(args));

// 		const result = await tester.runForLoop();

// 		expect(result).toMatchSnapshot();
// 	});
// });
