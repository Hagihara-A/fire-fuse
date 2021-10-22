import * as fuse from "./index.js";
import * as fs from "firebase/firestore";
import { Assert, City, DB, Exact, MySchema } from "./index.test";
import { collection } from "./collection.test.js";
export const doc = fuse.doc<MySchema>();

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
});
