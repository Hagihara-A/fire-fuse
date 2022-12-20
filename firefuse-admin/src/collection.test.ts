import { CollectionPaths, FuseCollectionReference } from "./collection.js";
import {
  Assert,
  City,
  DB,
  Exact,
  Extends,
  MySchema,
  NotExtends,
} from "./index.test.js";

describe(`CollectionPaths`, () => {
  type P = CollectionPaths<MySchema>;
  test(`\`cities\` extends CollectionPaths`, () => {
    type _ = Assert<Extends<"cities", P>>;
  });
  test(`"user" extends CollectionPaths`, () => {
    type _ = Assert<Extends<"user", P>>;
  });

  test(`"user/string/favRooms" extends CollectionPaths`, () => {
    type _ = Assert<Extends<`user/${string}/favRooms`, P>>;
  });

  test(`"cities/v1/cities" extends CollectionPaths`, () => {
    type _ = Assert<Extends<`cities/v1/cities`, P>>;
  });

  test(`"cities/v2/cities" extends CollectionPaths`, () => {
    type _ = Assert<Extends<"cities/v2/cities", P>>;
  });

  test(`"hoge/huga/piyo" not extends CollectionPaths`, () => {
    type _ = Assert<NotExtends<"hoge/huga/piyo", P>>;
  });
});

describe(`collection`, () => {
  test(`DB.collection("cities/v1/cities") returns ColRef<City>`, () => {
    const cities = DB.collection("cities/v1/cities");
    type _ = Assert<Exact<FuseCollectionReference<City>, typeof cities>>;
  });
});
