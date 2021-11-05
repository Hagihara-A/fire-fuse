import { Assert, City, DB, Match } from "../index.test.js";
import { WhereData } from "./where.js";

describe(`where`, () => {
  const cities = DB.collection("cities");
  test(`WhereData<City, "capital", "==", true> matches { capital: true }`, () => {
    type D = WhereData<City, "capital", "==", true>;
    type _ = Assert<Match<{ capital: true }, D>>;
  });
  test(`WhereData<City, "capital", "!=", true> matches { capital: false }`, () => {
    type D = WhereData<City, "capital", "!=", true>;
    type _ = Assert<Match<{ capital: false }, D>>;
  });
  test(`WhereData<City, "population", "in", [1, 2]> matches { population: 1 | 2 }`, () => {
    type D = WhereData<City, "population", "in", [1, 2]>;
    type _ = Assert<Match<{ population: 1 | 2 }, D>>;
  });
  test(`WhereData<City, "population", "not-in", [1, 2]> matches { population: number }`, () => {
    type D = WhereData<City, "population", "not-in", [1, 2]>;
    type _ = Assert<Match<{ population: number }, D>>;
  });  
  test(`WhereData<City, "regions", "array-contains", "Asia"> matches { regions: string[] }`, () => {
    type D = WhereData<City, "regions", "array-contains", "Asia">;
    type _ = Assert<Match<{ regions: string[] }, D>>;
  });
    test(`WhereData<City, "regions", "array-contains-any", ["Asia"]> matches { regions: string[] }`, () => {
      type D = WhereData<City, "regions", "array-contains-any", ["Asia"]>;
      type _ = Assert<Match<{ regions: string[] }, D>>;
    });
});
