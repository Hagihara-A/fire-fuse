import { Assert, City, DB, Exact, Extends, MySchema } from "./index.test.js";
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
    type _ = Assert<Exact<FuseCollectionReference<City>, typeof cities>>;
  });
});
