import { Assert, City, DB, Exact, Extends, MySchema } from "./index.test.js";
import * as admin from "firebase-admin";
import { CollectionPaths, FuseCollectionReference } from "./collection.js";

describe(`CollectionPaths`, () => {
  test(`\`cities\` extends CollectionPaths`, () => {
    type DP = CollectionPaths<MySchema>;
    type _ = Assert<Extends<DP, `cities`>>;
  });
});
describe(`collection`, () => {
  test(`DB.collection("cities") returns ColRef<City>`, () => {
    const cities = DB.collection("cities");
    type _ = Assert<
      Extends<admin.firestore.CollectionReference<City>, typeof cities>
    >;
    type __ = Assert<Exact<FuseCollectionReference<City>, typeof cities>>;
  });
});
