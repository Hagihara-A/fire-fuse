import {
  Assert,
  collection,
  DB,
  doc,
  Extends,
  MySchema,
  NotExtends,
} from "./index.test.js";
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

describe(`doc`, () => {
  test("doc(colRef) is OK", () => {
    const colRef = collection(DB, "user");
    expect(() => doc(colRef)).not.toThrow();
  });

  test("doc(colRef, 'id') is OK", () => {
    const colRef = collection(DB, "user");
    expect(() => doc(colRef, "id")).not.toThrow();
  });
});
