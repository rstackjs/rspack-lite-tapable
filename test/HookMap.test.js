/**
 * Tests for HookMap tap convenience methods
 */

"use strict";

const { HookMap, SyncHook, AsyncSeriesHook } = require("../");

describe("HookMap", () => {
	describe("tap convenience methods", () => {
		it("should redirect tap to for(key).tap", () => {
			const hookMap = new HookMap(() => new SyncHook(["arg"]));
			const calls = [];

			hookMap.tap("key1", "Plugin1", (arg) => {
				calls.push({ key: "key1", arg });
			});

			hookMap.tap("key2", "Plugin2", (arg) => {
				calls.push({ key: "key2", arg });
			});

			hookMap.for("key1").call("value1");
			hookMap.for("key2").call("value2");

			expect(calls).toEqual([
				{ key: "key1", arg: "value1" },
				{ key: "key2", arg: "value2" }
			]);
		});

		it("should redirect tapAsync to for(key).tapAsync", async () => {
			const hookMap = new HookMap(() => new AsyncSeriesHook(["arg"]));
			const calls = [];

			hookMap.tapAsync("key1", "Plugin1", (arg, callback) => {
				calls.push({ key: "key1", arg });
				callback();
			});

			await hookMap.for("key1").promise("value1");

			expect(calls).toEqual([{ key: "key1", arg: "value1" }]);
		});

		it("should redirect tapPromise to for(key).tapPromise", async () => {
			const hookMap = new HookMap(() => new AsyncSeriesHook(["arg"]));
			const calls = [];

			hookMap.tapPromise("key1", "Plugin1", async (arg) => {
				calls.push({ key: "key1", arg });
			});

			await hookMap.for("key1").promise("value1");

			expect(calls).toEqual([{ key: "key1", arg: "value1" }]);
		});

		it("should create hook on first tap if not exists", () => {
			const hookMap = new HookMap(() => new SyncHook(["arg"]));

			expect(hookMap.get("key1")).toBeUndefined();

			hookMap.tap("key1", "Plugin1", () => {});

			expect(hookMap.get("key1")).toBeDefined();
		});

		it("should reuse existing hook when tapping multiple times", () => {
			const hookMap = new HookMap(() => new SyncHook(["arg"]));
			const calls = [];

			hookMap.tap("key1", "Plugin1", () => calls.push("first"));
			hookMap.tap("key1", "Plugin2", () => calls.push("second"));

			hookMap.for("key1").call();

			expect(calls).toEqual(["first", "second"]);
		});
	});

	describe("for method", () => {
		it("should create hook on first access", () => {
			const hookMap = new HookMap(() => new SyncHook(["arg"]));

			expect(hookMap.get("key1")).toBeUndefined();

			const hook = hookMap.for("key1");

			expect(hook).toBeDefined();
			expect(hookMap.get("key1")).toBe(hook);
		});

		it("should return same hook on subsequent access", () => {
			const hookMap = new HookMap(() => new SyncHook(["arg"]));

			const hook1 = hookMap.for("key1");
			const hook2 = hookMap.for("key1");

			expect(hook1).toBe(hook2);
		});
	});

	describe("get method", () => {
		it("should return undefined for non-existent key", () => {
			const hookMap = new HookMap(() => new SyncHook(["arg"]));

			expect(hookMap.get("nonexistent")).toBeUndefined();
		});

		it("should return hook after it has been created", () => {
			const hookMap = new HookMap(() => new SyncHook(["arg"]));

			hookMap.for("key1");

			expect(hookMap.get("key1")).toBeDefined();
		});
	});

	describe("isUsed", () => {
		it("should return false when no hooks are used", () => {
			const hookMap = new HookMap(() => new SyncHook(["arg"]));

			expect(hookMap.isUsed()).toBe(false);
		});

		it("should return true when a hook has taps", () => {
			const hookMap = new HookMap(() => new SyncHook(["arg"]));

			hookMap.tap("key1", "Plugin1", () => {});

			expect(hookMap.isUsed()).toBe(true);
		});
	});
});
