"use strict";

const {
	SyncHook,
	SyncBailHook,
	SyncWaterfallHook,
	minStage,
	maxStage
} = require("../");

const allStages = [minStage, maxStage];

// call() skips the QueriedHook when nothing intercepts; it must stay indistinguishable from
// callStageRange over all stages.
const outcome = fn => {
	try {
		return ["returned", fn()];
	} catch (e) {
		return ["threw", e];
	}
};

const hookTypes = [
	["SyncHook", () => new SyncHook(["a", "b"])],
	["SyncBailHook", () => new SyncBailHook(["a", "b"])],
	["SyncWaterfallHook", () => new SyncWaterfallHook(["a", "b"])]
];

const scenarios = {
	"no taps": () => {},
	"taps returning undefined": hook => {
		hook.tap("A", () => undefined);
		hook.tap("B", () => undefined);
	},
	"taps returning values": hook => {
		hook.tap("A", a => `${a}-A`);
		hook.tap("B", a => `${a}-B`);
	},
	"taps in stages": hook => {
		hook.tap({ name: "late", stage: maxStage }, a => `${a}-late`);
		hook.tap({ name: "early", stage: minStage }, () => undefined);
		hook.tap({ name: "mid", stage: 5 }, a => `${a}-mid`);
	},
	"tap throwing an error": hook => {
		hook.tap("A", () => undefined);
		hook.tap("B", () => {
			throw new Error("boom");
		});
		hook.tap("C", a => `${a}-C`);
	},
	"tap throwing undefined": hook => {
		hook.tap("A", () => undefined);
		hook.tap("B", () => {
			throw undefined;
		});
		hook.tap("C", a => `${a}-C`);
	}
};

describe("call() without interceptors", () => {
	for (const [typeName, create] of hookTypes) {
		for (const [scenarioName, setup] of Object.entries(scenarios)) {
			it(`${typeName}: matches callStageRange with ${scenarioName}`, () => {
				const calls = [];
				const viaCall = create();
				const viaRange = create();
				for (const hook of [viaCall, viaRange]) {
					setup(hook);
					for (const tap of hook.taps) {
						const fn = tap.fn;
						tap.fn = (...args) => {
							calls.push([hook === viaCall ? "call" : "range", tap.name, args]);
							return fn(...args);
						};
					}
				}

				const a = outcome(() => viaCall.call("x", "y", "extra"));
				const b = outcome(() =>
					viaRange.callStageRange(viaRange.queryStageRange(allStages), "x", "y", "extra")
				);

				expect(a).toEqual(b);
				const strip = which =>
					calls.filter(c => c[0] === which).map(([, name, args]) => [name, args]);
				expect(strip("call")).toEqual(strip("range"));
			});
		}
	}

	it("runs taps added after an earlier call", () => {
		const hook = new SyncHook(["a"]);
		const mock1 = rstest.fn();
		const mock2 = rstest.fn();
		hook.tap("A", mock1);
		hook.call(1);
		hook.tap("B", mock2);
		hook.call(2);
		expect(mock1).toHaveBeenCalledTimes(2);
		expect(mock2).toHaveBeenCalledTimes(1);
		expect(mock2).toHaveBeenLastCalledWith(2);
	});

	it("follows a replaced or spliced taps array", () => {
		const hook = new SyncBailHook(["a"]);
		hook.tap("A", () => "A");
		hook.tap("B", () => "B");
		expect(hook.call()).toBe("A");

		hook.taps = hook.taps.filter(tap => tap.name !== "A");
		expect(hook.call()).toBe("B");

		hook.taps.splice(0, 1);
		expect(hook.call()).toBe(undefined);
	});

	it("does not run a tap registered during the same call", () => {
		const hook = new SyncHook([]);
		const late = rstest.fn();
		hook.tap("A", () => {
			if (!late.registered) {
				late.registered = true;
				hook.tap("late", late);
			}
		});
		hook.call();
		expect(late).not.toHaveBeenCalled();
		hook.call();
		expect(late).toHaveBeenCalledTimes(1);
	});

	it("goes back to the interceptor path once intercepted", () => {
		const hook = new SyncWaterfallHook(["a"]);
		hook.tap("A", a => a + 1);
		expect(hook.call(1)).toBe(2);

		const seen = [];
		hook.intercept({
			call: a => seen.push(["call", a]),
			tap: tap => seen.push(["tap", tap.name]),
			done: () => seen.push(["done"])
		});
		expect(hook.call(1)).toBe(2);
		expect(seen).toEqual([["call", 1], ["tap", "A"], ["done"]]);
	});
});
