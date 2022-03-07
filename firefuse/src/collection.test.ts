import { CollectionPaths } from "./collection.js";
import { Assert, Extends, MySchema } from "./index.test.js";

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
