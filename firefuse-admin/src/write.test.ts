import { DocumentReference } from "firebase-admin/firestore";
import { Assert, DB, Extends, Match, Room } from "./index.test";
import { UpdateData, UpdateValue } from "./reference";

describe("update", () => {
  describe("UpdateData", () => {
    test(`UpdateData<City> contains { "rooms.living": number }`, () => {
      type A = UpdateData<Room>;
      type _ = Assert<Match<{ "rooms.living": number }, A>>;
    });

    test(`UpdateData<City> contains { rooms : {...} }`, () => {
      type A = UpdateData<Room>;
      type _ = Assert<
        Match<{ rooms: { living?: number; dining?: number; kitchen?: number } }, A>
      >;
    });
  });

  test("update top-level data", async () => {
    const city = DB.doc("rooms/abc");
    await city.update({ "rooms.living": 7 });
  });
});
