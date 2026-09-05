import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SKIDDLE_AFFILIATE_TAG, withSkiddleTag } from "./skiddle";

describe("withSkiddleTag", () => {
  it("adds sktag when the URL has no query params", () => {
    const input =
      "https://www.skiddle.com/whats-on/Manchester/Matt-And-Phreds/MPs-Jazz-Brunch/42581900/";
    const result = withSkiddleTag(input);
    const parsed = new URL(result);
    assert.equal(parsed.searchParams.get("sktag"), SKIDDLE_AFFILIATE_TAG);
    assert.equal(
      parsed.pathname,
      "/whats-on/Manchester/Matt-And-Phreds/MPs-Jazz-Brunch/42581900/",
    );
  });

  it("sets sktag alongside existing query params", () => {
    const input =
      "https://www.skiddle.com/e/12345/?ref=feed&utm_source=happenmcr";
    const result = withSkiddleTag(input);
    const parsed = new URL(result);
    assert.equal(parsed.searchParams.get("sktag"), SKIDDLE_AFFILIATE_TAG);
    assert.equal(parsed.searchParams.get("ref"), "feed");
    assert.equal(parsed.searchParams.get("utm_source"), "happenmcr");
  });

  it("leaves non-Skiddle URLs unchanged", () => {
    const input = "https://www.ticketmaster.co.uk/event/123";
    assert.equal(withSkiddleTag(input), input);
  });

  it("returns invalid URL strings unchanged", () => {
    assert.equal(withSkiddleTag("not-a-url"), "not-a-url");
    assert.equal(withSkiddleTag(""), "");
  });

  it("overwrites an existing sktag rather than duplicating", () => {
    const input = "https://skiddle.com/e/1/?sktag=99999";
    const result = withSkiddleTag(input);
    const parsed = new URL(result);
    assert.equal(parsed.searchParams.get("sktag"), SKIDDLE_AFFILIATE_TAG);
    assert.equal(parsed.searchParams.getAll("sktag").length, 1);
  });
});
