import { describe, expect, it } from "vitest";
import { SHARE_CARD_SIZES } from "@/lib/client/share-card";

describe("share card formats", () => {
  it("keeps the required story and square dimensions", () => {
    expect(SHARE_CARD_SIZES.story).toMatchObject({ width: 1080, height: 1920 });
    expect(SHARE_CARD_SIZES.square).toMatchObject({ width: 1080, height: 1080 });
  });
});
