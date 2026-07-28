"use strict";

describe("package exports", () => {
	it("should export package.json", () => {
		expect(require("@rspack/lite-tapable/package.json")).toMatchObject({
			name: "@rspack/lite-tapable"
		});
	});
});
