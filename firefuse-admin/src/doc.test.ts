import {
  Assert,
  City,
  DB,
  Exact,
  Extends,
  MySchema,
  NotExtends,
} from "./index.test.js";
import { FuseDocumentReference } from "./reference.js";
import { DocumentPaths } from "./doc.js";

describe(`DocumentPaths`, () => {
  type P = DocumentPaths<MySchema>;
  test(`"cities/v1" extends DocumentPaths`, () => {
    type _ = Assert<Extends<"cities/v1", P>>;
  });
  test(`"user/string" extends DocumentPaths`, () => {
    type _ = Assert<Extends<`user/${string}`, P>>;
  });

  test(`"user/string/favRooms/string" extends DocumentPaths`, () => {
    type _ = Assert<Extends<`user/${string}/favRooms/${string}`, P>>;
  });

  test(`"cities/v1/cities/id" extends DocumentPaths`, () => {
    type _ = Assert<Extends<"cities/v1/cities/id", P>>;
  });

  test(`"cities/v2/cities/id" extends DocumentPaths`, () => {
    type _ = Assert<Extends<"cities/v2/cities/id", P>>;
  });

  test(`"hoge/huga/piyo" not extends DocumentPaths`, () => {
    type _ = Assert<NotExtends<"hoge/huga/piyo", P>>;
  });
});

describe(`doc`, () => {
  test(`DB.doc("cities/v1/cities/id") returns ColRef<City>`, () => {
    const cities = DB.doc("cities/v1/cities/id");
    type _ = Assert<Exact<FuseDocumentReference<City>, typeof cities>>;
  });
});
