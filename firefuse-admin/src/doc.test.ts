import { Assert, City, DB, Exact, Extends, MySchema } from "./index.test.js";
import * as admin from "firebase-admin";
import { FuseDocumentReference } from "./reference.js";
import { DocumentPaths } from "./doc.js";

describe(`DocumentPaths`, () => {
  test(`\`cities/\${string}\` extends DocumentPaths`, () => {
    type DP = DocumentPaths<MySchema>;
    type _ = Assert<Extends<DP, `cities/${string}`>>;
  });
});
describe(`doc`, () => {
  test(`DB.doc("cities/abc") returns DocRef<City>`, () => {
    const city = DB.doc("cities/abc");
    type _ = Assert<
      Extends<admin.firestore.DocumentReference<City>, typeof city>
    >;
    type __ = Assert<Exact<FuseDocumentReference<City>, typeof city>>;
  });
});
