import { City } from "../index.test.js";
import { orderBy as O } from "./orderby.js";
const orderBy = O<City>();
describe("orderBy", () => {
  test(`able to create orderBy("population")`, () => {
    expect(() => orderBy("population")).not.toThrow();
  });
  test(`able to create orderBy("population", "desc")`, () => {
    expect(() => orderBy("population", "desc")).not.toThrow();
  });
});
