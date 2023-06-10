import { ChildDocPath, DocumentPaths, StringDocKeyData } from "./doc.js";
import {
  Assert,
  City,
  CityV2,
  collection,
  Count,
  DB,
  doc,
  Empty,
  Exact,
  Extends,
  L2D1,
  MySchema,
  NotExtends,
  User,
} from "./index.test.js";

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
  test("doc(colRef, undefined) is OK", () => {
    const colRef = collection(DB, "user");
    doc(colRef);
  });

  test("doc(colRef, 'id') is OK", () => {
    const colRef = collection(DB, "user");
    doc(colRef, "id");
  });

  test("doc(citiesCol, 'v1') is OK", () => {
    const citiesCol = collection(DB, "cities");
    doc(citiesCol, "v1");
  });

  test('doc(collection(DB, "l1-c1", "a", "l2-c1"), "v111111") is type error', () => {
    const c = collection(DB, "l1-c1", "a", "l2-c1");
    // @ts-expect-error doc
    doc(c, "v111111");
  });

  test("doc(collection(DB, 'l1-c1'), undefined) is OK", () => {
    const c = collection(DB, "l1-c1");
    doc(c);
  });
});

describe("ChildDocPath", () => {
  test("ChildDocPath<S, City> is string", () => {
    type P = ChildDocPath<MySchema, City>;
    type _ = Assert<Exact<P, string>>;
  });
  test("ChildDocPath<S, L2D1> is 'l2-d1'", () => {
    type P = ChildDocPath<MySchema, L2D1>;
    type _ = Assert<Exact<P, "l2-d1">>;
  });
});

describe("StringDocKeyData", () => {
  test("StringDocKeyData<S>", () => {
    type D = StringDocKeyData<MySchema>;
    type E = User | Count | City | CityV2 | Empty;
    type _ = Assert<Extends<E, D>>;
  });
});
