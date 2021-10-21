import * as fs from "firebase/firestore";
import { Defined, LegalValue } from "..";
import { Assert, City, Exact, Extends } from "../index.test";
import { LegalOperation } from "./where.js";

test(`Defined<{a?: string}, "a"> is {a: string}`, () => {
  type T = Defined<{ a?: string }, "a">;
  type _ = Assert<Exact<{ a: string }, T>>;
});
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
});
