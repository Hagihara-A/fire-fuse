import { Assert, City, Exact, Extends, User } from "../index.test.js";
import { LegalValue, WhereData } from "./where.js";

describe(`where`, () => {
  test(`WhereData<City, "capital", "==", true> matches { capital: true }`, () => {
    type D = WhereData<City, "capital", "==", true>;
    type _ = Assert<Extends<D, { capital: true }>>;
  });
  test(`WhereData<City, "capital", "!=", true> matches { capital: false }`, () => {
    type D = WhereData<City, "capital", "!=", true>;
    type _ = Assert<Extends<D, { capital: false }>>;
  });
  test(`WhereData<City, "population", "in", [1, 2]> matches { population: 1 | 2 }`, () => {
    type D = WhereData<City, "population", "in", [1, 2]>;
    type _ = Assert<Extends<D, { population: 1 | 2 }>>;
  });
  test(`WhereData<City, "population", "not-in", [1, 2]> matches { population: number }`, () => {
    type D = WhereData<City, "population", "not-in", [1, 2]>;
    type _ = Assert<Extends<D, { population: number }>>;
  });
  test(`WhereData<City, "regions", "array-contains", "Asia"> matches { regions: string[] }`, () => {
    type D = WhereData<City, "regions", "array-contains", "Asia">;
    type _ = Assert<Extends<D, { regions: string[] }>>;
  });
  test(`WhereData<City, "regions", "array-contains-any", ["Asia"]> matches { regions: string[] }`, () => {
    type D = WhereData<City, "regions", "array-contains-any", ["Asia"]>;
    type _ = Assert<Extends<D, { regions: string[] }>>;
  });
  test(`WhereData<User, "sex", "in", ["male", "female"]> matches { sex: "male" | "female" }`, () => {
    type D = WhereData<User, "sex", "in", ["male", "female"]>;
    type _ = Assert<Extends<D, { sex: "male" | "female" }>>;
  });
  test(`WhereData<User, "sex", "in", readonly ["male", "female"]> matches { sex: "male" | "female" }`, () => {
    type D = WhereData<User, "sex", "in", readonly ["male", "female"]>;
    type _ = Assert<Extends<D, { sex: "male" | "female" }>>;
  });
  test(`WhereData<User, "sex", "in", ["male", "female"]> matches { sex: "male" | "female" }`, () => {
    type D = WhereData<User, "sex", "not-in", readonly ["male", "female"]>;
    type _ = Assert<Extends<D, { sex: "other" }>>;
  });
});

describe("LegalValue", () => {
  test("(string | null)[] array-contains string | null", () => {
    type T = {
      a: (string | null)[];
    };
    type W = LegalValue<T, "a", "array-contains">;
    type _ = Assert<Exact<string | null, W>>;
  });
  test("(string | null)[]| undefined array-contains string | null", () => {
    type T = {
      a?: (string | null)[];
    };
    type W = LegalValue<T, "a", "array-contains">;
    type _ = Assert<Exact<string | null, W>>;
  });

  test("string | null", () => {
    type V = LegalValue<City, "state", "==">;
    type _ = Assert<Exact<string | null, V>>;
  });
});
