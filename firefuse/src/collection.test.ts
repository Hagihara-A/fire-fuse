import * as fs from "firebase/firestore";
import { CollectionPaths } from "./collection.js";
import {
  Assert,
  City,
  collection,
  DB,
  Exact,
  Extends,
  MySchema,
} from "./index.test.js";

test(`collection(DB, "cities") returuns CollectionReference<City>`, () => {
  const cities = collection(DB, "cities");
  type _ = Assert<Exact<fs.CollectionReference<City>, typeof cities>>;
});

describe(`CollectionPaths`, () => {
  test(`["user"] extends CollectionPaths`, () => {
    type ColPaths = CollectionPaths<MySchema>;
    type _ = Assert<Extends<["user"], ColPaths>>;
  });

  test(`["user", string, "favRooms"] extends CollectionPaths`, () => {
    type ColPaths = CollectionPaths<MySchema>;
    type _ = Assert<Extends<["user", string, "favRooms"], ColPaths>>;
  });

  test(`["cities", "v1", "cities"] extends CollectionPaths`, () => {
    type ColPaths = CollectionPaths<MySchema>;
    type _ = Assert<Extends<["cities", "v1", "cities"], ColPaths>>;
  });

  test(`["cities", "v2", "cities"] extends CollectionPaths`, () => {
    type ColPaths = CollectionPaths<MySchema>;
    type _ = Assert<Extends<["cities", "v2", "cities"], ColPaths>>;
  });
});
