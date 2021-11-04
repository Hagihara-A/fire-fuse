import { Assert, DB, Extends, Match, Room } from "./index.test";
import { UpdateData, UpdatePaths } from "./update.js";

describe(`UpdatePaths`, () => {
  test(`"size" extends UpdatePaths<Room>`, () => {
    type P = UpdatePaths<Room>;
    type _ = Assert<Extends<P, "size">>;
  });
  test(`"rooms.living" extends UpdatePaths<Room>`, () => {
    type P = UpdatePaths<Room>;
    type _ = Assert<Extends<P, "rooms.living">>;
  });
});
describe("update", () => {
  describe("UpdateData", () => {
    test(`UpdateData<City> contains { "rooms.living": number }`, () => {
      type A = UpdateData<Room>;
      type _ = Assert<Match<{ "rooms.living"?: number }, A>>;
    });

    test(`UpdateData<City> contains { rooms : {...} }`, () => {
      type A = UpdateData<Room>;
      type _ = Assert<
        Match<
          { rooms?: { living?: number; dining?: number; kitchen?: number } },
          A
        >
      >;
    });
  });

  test("update top-level data", async () => {
    const city = DB.doc("room/abc");
    await city.update({ "rooms.living": 7 });
  });
});
