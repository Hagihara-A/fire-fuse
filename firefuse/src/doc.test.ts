import { Assert, Extends, MySchema, NotExtends, Room } from "./index.test.js";
import { DocumentPaths } from "./doc.js";

describe(`DocumentPaths`, () => {
  test(`["user", string] extends DocumentPaths`, () => {
    type P = DocumentPaths<MySchema>;
    type _ = Assert<Extends<["user", string], P>>;
  });

  test(`["user", string, "favRooms"] not extends DocumentPaths`, () => {
    type P = DocumentPaths<MySchema>;
    type _ = Assert<NotExtends<["user", string, "favRooms"], P>>;
  });
});
