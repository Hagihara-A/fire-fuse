import { CollectionPaths } from "./collection.js";
import { Assert, Extends, MySchema, NotExtends } from "./index.test.js";

describe(`CollectionPaths`, () => {
  type P = CollectionPaths<MySchema>;
  test(`["user"] extends CollectionPaths`, () => {
    type _ = Assert<Extends<["user"], P>>;
  });

  test(`["user", string, "favRooms"] extends CollectionPaths`, () => {
    type _ = Assert<Extends<["user", string, "favRooms"], P>>;
  });

  test(`["cities", "v1", "cities"] extends CollectionPaths`, () => {
    type _ = Assert<Extends<["cities", "v1", "cities"], P>>;
  });

  test(`["cities", "v2", "cities"] extends CollectionPaths`, () => {
    type _ = Assert<Extends<["cities", "v2", "cities"], P>>;
  });

  test(`["hoge", "huga", "piyo"] not extends CollectionPaths`, () => {
    type _ = Assert<NotExtends<["hoge", "huga", "piyo"], P>>;
  });
});
