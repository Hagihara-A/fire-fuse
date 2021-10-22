import * as fs from "firebase/firestore";
import { LegalValue } from "..";
import { Assert, City, DB, Exact, Extends } from "../index.test";
import { LegalOperation, where as W } from "./where.js";
const where = W<City>();

describe(`LegalOperation`, () => {
  test(`"array-contains" extends LegalOperation<City, "regions">`, () => {
    type T = LegalOperation<City, "regions">;
    type _ = Assert<Extends<"array-contains", T>>;
  });
  test(`"array-contains-any" extends LegalOperation<City, "regions">`, () => {
    type T = LegalOperation<City, "regions">;
    type _ = Assert<Extends<"array-contains-any", T>>;
  });
});

describe(`LegaolValue`, () => {
  test(`string exact LegalValue<City, "regions", "array-contains">`, () => {
    type T = LegalValue<City, "regions", "array-contains">;
    type _ = Assert<Exact<T, string>>;
  });
  test("(string | null)[] array-contains string | null", () => {
    type T = {
      a: (string | null)[];
    };
    type V = LegalValue<T, "a", "array-contains">;
    type _ = Assert<Exact<string | null, V>>;
  });
  test("(string | null)[]| undefined array-contains string | null", () => {
    type T = {
      a?: (string | null)[];
    };
    type V = LegalValue<T, "a", "array-contains">;
    type _ = Assert<Exact<string | null, V>>;
  });

  test("LegalValue<City, 'state', '=='> is string | null", () => {
    type V = LegalValue<City, "state", "==">;
    type _ = Assert<Exact<string | null, V>>;
  });
});
describe(`where`, () => {
  test("able to create where(capital, ==, true)", () => {
    expect(() => where("capital", "==", true)).not.toThrow();
  });
  test(`able to create where("regions", "array-contains", "west_coast")`, () => {
    expect(() =>
      where("regions", "array-contains", "west_coast")
    ).not.toThrow();
  });
});
