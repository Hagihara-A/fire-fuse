import * as fs from "firebase/firestore";
import { collection as C } from "./collection.js";
import { Assert, City, DB, Exact, MySchema } from "./index.test.js";

export const collection = C<MySchema>();

test(`collection(DB, "cities") returuns CollectionReference<City>`, () => {
  const cities = collection(DB, "cities");
  type _ = Assert<Exact<fs.CollectionReference<City>, typeof cities>>;
});
