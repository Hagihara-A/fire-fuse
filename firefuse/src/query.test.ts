import * as fs from "firebase/firestore";
import * as fuse from "./index.js";
import { ConstrainedData as CD } from "./index.js";
import {
  Assert,
  City,
  DB,
  Exact,
  Match,
  MySchema,
  Never,
} from "./index.test.js";
import { collection as C } from "./collection.js";
import { query } from "./query.js";
const where = fuse.where<City>();
const orderBy = fuse.orderBy<City>();
const collection = C<MySchema>();
const cities = collection(DB, "cities");

describe("ConstraintedData", () => {
  const cities = collection(DB, "cities");

  describe("single constraint", () => {
    test("field of > exists", () => {
      const cs = [where("population", ">=", 1000)] as const;
      type T = CD<City, typeof cs>;

      type _ = Assert<Match<{ population: number }, T>>;
    });

    test("field of == exists", () => {
      const cs = [where("capital", "==", true as const)] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Match<{ capital: true }, T>>;
    });

    test("field of != exists", () => {
      const cs = [where("name", "!=", "asd" as const)] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Match<{ name: string }, T>>;
    });

    test("field of array-contains exists", () => {
      const cs = [where("regions", "array-contains", "asd")] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Match<{ regions: string[] }, T>>;
    });

    test("field of array-contains-any exists", () => {
      const cs = [where("regions", "array-contains-any", ["asd"])] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Match<{ regions: string[] }, T>>;
    });

    test("field of in exists", () => {
      const cs = [where("population", "in", [1000, 2000] as const)] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Match<{ population: 1000 | 2000 }, T>>;
    });

    test("field of not-in exists", () => {
      const cs = [
        where("population", "not-in", [1000, 2000] as const),
      ] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Match<{ population: number }, T>>;
    });

    test("name != string is not never", () => {
      const cs = [where("name", "!=", "tokyo")] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Match<{ name: string }, T>>;
      expect(() => fs.getDocs(fs.query(cities, ...cs))).not.toThrow();
    });

    test("name not-in string[] is not never", () => {
      const cs = [where("name", "not-in", ["tokyo"])] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Match<{ name: string }, T>>;
      expect(() => fs.getDocs(fs.query(cities, ...cs))).not.toThrow();
    });

    test("!= excludes literal union", () => {
      type M = {
        type?: "A" | "B" | "C";
      };

      const where = fuse.where<M>();
      const cs = [where("type", "!=", "A" as const)] as const;
      type T = CD<M, typeof cs>;
      type _ = Assert<Exact<{ type: "B" | "C" }, T>>;
    });

    test("not-in excludes literal union", () => {
      type M = {
        type?: "A" | "B" | "C";
      };
      const where = fuse.where<M>();
      const cs = [where("type", "not-in", ["A", "C"] as const)] as const;
      type T = CD<M, typeof cs>;
      type _ = Assert<Exact<{ type: "B" }, T>>;
    });

    test("== narros sliteral union", () => {
      type M = {
        type?: "A" | "B" | "C";
      };
      const where = fuse.where<M>();
      const cs = [where("type", "==", "A" as const)] as const;
      type T = CD<M, typeof cs>;
      type _ = Assert<Exact<{ type: "A" }, T>>;
    });

    test("in narrows literal union", () => {
      type M = {
        type?: "A" | "B" | "C";
      };
      const where = fuse.where<M>();
      const cs = [where("type", "in", ["A", "C"] as const)] as const;
      type T = CD<M, typeof cs>;
      type _ = Assert<Exact<{ type: "A" | "C" }, T>>;
    });
  });
  describe("combinated constraints", () => {
    test("== & ==", () => {
      const cs = [
        where("capital", "==", true as const),
        where("population", "==", 1000 as const),
      ] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Match<{ population: 1000; capital: true }, T>>;
      expect(() => fs.query(cities, ...cs)).not.toThrow();
    });

    test("< & == is OK. field exists", () => {
      const cs = [
        where("population", "<", 1000),
        where("capital", "==", true),
      ] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Match<{ population: number; capital: boolean }, T>>;
      expect(() => fs.getDocs(fs.query(cities, ...cs))).not.toThrow();
    });

    test("population > 1000 & population < 2000 is OK", () => {
      const cs = [
        where("population", ">", 1000),
        where("population", "<", 2000),
      ] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Match<{ population: number }, T>>;
      expect(() => fs.getDocs(fs.query(cities, ...cs))).not.toThrow();
    });

    test("population > 1000 & name < US is never", () => {
      const cs = [
        where("population", ">", 1000),
        where("name", "<", "US"),
      ] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Never<T>>;
      expect(() => fs.query(cities, ...cs)).toThrow();
    });

    test("!= & not-in is never", () => {
      const cs = [
        where("population", "!=", 1000),
        where("name", "not-in", ["US"]),
      ] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Never<T>>;
      expect(() => fs.query(cities, ...cs)).toThrow();
    });

    test("arr-con & arr-con-any is never", () => {
      const cs = [
        where("regions", "array-contains", ""),
        where("regions", "array-contains-any", ["US"]),
      ] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Never<T>>;
      expect(() => fs.query(cities, ...cs)).toThrow();
    });

    test("not-in & in & >= & == && orderBy && ...otherConstraints is valid", () => {
      const cs = [
        where("capital", "==", true),
        where("state", ">=", "ABC"),
        where("state", "in", ["CA"]),
        orderBy("state"),
        fuse.limit(3),
        fuse.limitToLast(2),
        fuse.startAt(1000),
        fuse.startAfter(10000),
        fuse.endAt(100000),
        fuse.endBefore(1000000),
      ] as const;

      type T = CD<City, typeof cs>;
      type _ = Assert<Match<{ capital: boolean; state: string }, T>>;
    });

    test("population > 123 & orderBy(population) is OK", () => {
      const cs = [
        where("population", ">", 123),
        orderBy("population"),
      ] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Match<{ population: number }, T>>;
    });

    test("population > 123 & orderBy(name) is NG", () => {
      const cs = [where("population", ">", 123), orderBy("name")] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Never<T>>;
      expect(() => fs.getDocs(fs.query(cities, ...cs))).toThrow();
    });

    test(`where(name), orderBy(name), orderBy(population) is OK`, () => {
      const cs = [
        where("name", ">", "ABC"),
        orderBy("name"),
        orderBy("population"),
      ] as const;

      type T = CD<City, typeof cs>;
      type _ = Assert<Match<{ name: string }, T>>;
    });

    test("population > number & name not-in string[] is never", () => {
      const cs = [
        where("population", ">", 1000),
        where("name", "not-in", ["A", "B"]),
      ] as const;

      type T = CD<City, typeof cs>;
      type _ = Assert<Never<T>>;
    });

    test("population > number & name != string is never", () => {
      const cs = [
        where("population", ">", 1000),
        where("name", "!=", "A"),
      ] as const;

      type T = CD<City, typeof cs>;
      type _ = Assert<Never<T>>;
    });
  });
});

test("use fuse.where with firestore.query", () => {
  expect(() =>
    fs.query(collection(DB, "user"), where("capital", "==", true))
  ).not.toThrow();
});

test("use fuse.orderBy with firestore.query", () => {
  expect(() =>
    fs.query(collection(DB, "user"), orderBy("capital"))
  ).not.toThrow();
});

describe(`query with where`, () => {
  test(`query(where("country", "in", ["USA", "Japan"] as const)) narrows "country"`, async () => {
    const c = where("country", "in", ["USA", "Japan"] as const);
    const q = query(cities, c);
    type D = typeof q extends fs.Query<infer T> ? T : never;
    type _ = Assert<Match<{ country: "USA" | "Japan" }, D>>;
    const querySS = await fs.getDocs(q);
    querySS.forEach((ss) => {
      expect(["USA", "Japan"]).toContain(ss.data().country);
    });
  });

  test(`query(where("country", "not-in", ["USA", "Japan"])) returns Query<City>`, async () => {
    const q = fs.query(cities, where("country", "not-in", ["USA", "Japan"]));
    type _ = Assert<Exact<fs.Query<City>, typeof q>>;
    const querySS = await fs.getDocs(q);
    querySS.forEach((ss) => {
      expect(["USA", "Japan"]).not.toContain(ss.data().country);
    });
  });

  test(`query(where("regions", "array-contains-any", ["west_coast", "east_coast"] as const)) Defined<City, "regions">`, async () => {
    const q = query(
      cities,
      where("regions", "array-contains-any", ["west_coast", "east_coast"])
    );
    type D = typeof q extends fs.Query<infer T> ? T : never;
    type _ = Assert<Match<{ regions: string[] }, D>>;
    const querySS = await fs.getDocs(q);
    querySS.forEach((ss) => {
      const regions = ss.data().regions;
      expect(
        regions?.includes("west_coast") || regions?.includes("east_coast")
      ).toBeTruthy();
    });
  });
});

  describe("query with orderBy", () => {
    test(`use query with orderBy("population") doesnt throw`, async () => {
      const q = query(cities, orderBy("population"));
      const querySS = await fs.getDocs(q);
      let prev = 0;
      querySS.forEach((ss) => {
        const population = ss.data().population;
        expect(population).toBeGreaterThanOrEqual(prev);
        prev = population ?? prev;
      });
    });

    test(`get cities orderBy("population", "desc")`, async () => {
      const q = fs.query(cities, orderBy("population", "desc"));
      const querySS = await fs.getDocs(q);
      let prev = 100000000;
      querySS.forEach((ss) => {
        const population = ss.data().population;
        expect(population).toBeLessThanOrEqual(prev);
        prev = population ?? prev;
      });
    });
  });