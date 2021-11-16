import * as fuse from "./index.js";
import * as fs from "firebase/firestore";
import { Assert, City, DB, Exact, MySchema, Room } from "./index.test.js";
import { collection } from "./collection.test.js";

export const doc = fs.doc as fuse.Doc<MySchema>;

describe(`${doc.name}`, () => {
  test("doc(DB, 'cities', 'LA') is DocumentReference<City>", async () => {
    const LARef = doc(DB, "cities", "LA");
    type _ = Assert<Exact<typeof LARef, fs.DocumentReference<City>>>;
    const data = {
      name: "Los Angeles",
      state: "CA",
      country: "USA",
    };
    await fs.setDoc(LARef, data);
    const LASS = await fs.getDoc(LARef);
    expect(LASS.data()).toEqual(data);
  });
  test("doc(collection(...))) is DocumentReference<City>", async () => {
    const newCityRef = doc(collection(DB, "cities"));
    type _ = Assert<Exact<typeof newCityRef, fs.DocumentReference<City>>>;
    const data = {
      name: "Los Angeles",
      state: "CA",
      country: "USA",
    };
    await fs.setDoc(newCityRef, data);
    const savedDoc = await fs.getDoc(newCityRef);
    expect(savedDoc.data()).toEqual(data);
  });
  test(`document can have DocumentReference`, async () => {
    const roomRef = doc(DB, "room", "roomID");
    const cityRef = doc(DB, "cities", "tokyo");
    const data: Room = {
      size: 3,
      city: cityRef,
      rooms: {
        dining: 1,
        kitchen: 2,
        living: 3,
      },
    };
    await fs.setDoc(roomRef, data);
    const roomSS = await fs.getDoc(roomRef);
    expect(roomSS?.data()?.city?.path).toBe(cityRef.path);
  });
});
