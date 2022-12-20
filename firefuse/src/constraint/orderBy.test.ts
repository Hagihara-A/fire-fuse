import * as fst from "firebase/firestore";

import { City } from "../index.test.js";
import { OrderBy } from "./orderby.js";

const orderBy = fst.orderBy as OrderBy<City>;
describe("OrderBy<City>", () => {
  test(`able to create orderBy("population")`, () => {
    expect(() => orderBy("population")).not.toThrow();
  });
  test(`able to create orderBy("population", "desc")`, () => {
    expect(() => orderBy("population", "desc")).not.toThrow();
  });
});
