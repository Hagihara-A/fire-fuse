import { Assert, Extends, Match, Room } from "./index.test";
import { UpdateData, UpdatePaths } from "./update.js";

describe(`UpdatePaths`, () => {
  test(`"size" extends UpdatePaths<Room>`, () => {
    type P = UpdatePaths<Room>;
    type _ = Assert<Extends<"size", P>>;
  });
  test(`"rooms.living" extends UpdatePaths<Room>`, () => {
    type P = UpdatePaths<Room>;
    type _ = Assert<Extends<"rooms.living", P>>;
  });
});
describe("update", () => {
  describe("UpdateData", () => {
    test(`UpdateData<City> contains { "rooms.living": number }`, () => {
      type D = UpdateData<Room>;
      type _ = Assert<Match<{ "rooms.living"?: number }, D>>;
    });

    test(`UpdateData<City> contains { rooms : {...} }`, () => {
      type D = UpdateData<Room>;
      type _ = Assert<
        Match<
          { rooms?: { living: number; dining: number; kitchen: number } },
          D
        >
      >;
    });
  });
});
