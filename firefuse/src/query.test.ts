import * as fst from "firebase/firestore";

import { OrderBy } from "./constraint/orderby.js";
import { Where } from "./constraint/where.js";
import * as fuse from "./index.js";
import { ConstrainedData as CD } from "./index.js";
import {
  Assert,
  City,
  collection,
  DB,
  Exact,
  Extends,
  Never,
  query,
} from "./index.test.js";

describe("ConstraintedData", () => {
  const cities = collection(DB, "cities", "v1", "cities");

  describe("single constraint", () => {
    const where = fst.where as Where<City>;
    test("field of > exists", () => {
      const cs = [where("population", ">=", 1000)] as const;
      type T = CD<City, typeof cs>;

      type _ = Assert<Extends<T, { population: number }>>;
    });

    test("field of == exists", () => {
      const cs = [where("capital", "==", true as const)] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Extends<T, { capital: true }>>;
    });

    test("field of != exists", () => {
      const cs = [where("name", "!=", "asd" as const)] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Extends<T, { name: string }>>;
    });

    test("field of array-contains exists", () => {
      const cs = [where("regions", "array-contains", "asd")] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Extends<T, { regions: string[] }>>;
    });

    test("field of array-contains-any exists", () => {
      const cs = [where("regions", "array-contains-any", ["asd"])] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Extends<T, { regions: string[] }>>;
    });

    test("field of in exists", () => {
      const cs = [where("population", "in", [1000, 2000] as const)] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Extends<T, { population: 1000 | 2000 }>>;
    });

    test("field of not-in exists", () => {
      const cs = [
        where("population", "not-in", [1000, 2000] as const),
      ] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Extends<T, { population: number }>>;
    });

    test("name != string is not never", () => {
      const cs = [where("name", "!=", "tokyo")] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Extends<T, { name: string }>>;
      expect(() => fst.getDocs(query(cities, ...cs))).not.toThrow();
    });

    test("name not-in string[] is not never", () => {
      const cs = [where("name", "not-in", ["tokyo"])] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Extends<T, { name: string }>>;
      expect(() => fst.getDocs(query(cities, ...cs))).not.toThrow();
    });

    test("!= excludes literal union", () => {
      type M = {
        type?: "A" | "B" | "C";
      };
      const where = fst.where as Where<M>;
      const cs = [where("type", "!=", "A" as const)] as const;
      type T = CD<M, typeof cs>;
      type _ = Assert<Exact<{ type: "B" | "C" }, T>>;
    });

    test("not-in excludes literal union", () => {
      type M = {
        type?: "A" | "B" | "C";
      };
      const where = fst.where as Where<M>;
      const cs = [where("type", "not-in", ["A", "C"] as const)] as const;
      type T = CD<M, typeof cs>;
      type _ = Assert<Exact<{ type: "B" }, T>>;
    });

    test("== narros sliteral union", () => {
      type M = {
        type?: "A" | "B" | "C";
      };
      const where = fst.where as Where<M>;
      const cs = [where("type", "==", "A" as const)] as const;
      type T = CD<M, typeof cs>;
      type _ = Assert<Exact<{ type: "A" }, T>>;
    });

    test("in narrows literal union", () => {
      type M = {
        type?: "A" | "B" | "C";
      };
      const where = fst.where as Where<M>;
      const cs = [where("type", "in", ["A", "C"] as const)] as const;
      type T = CD<M, typeof cs>;
      type _ = Assert<Exact<{ type: "A" | "C" }, T>>;
    });
  });
  describe("combinated constraints", () => {
    const where = fst.where as Where<City>;
    const orderBy = fst.orderBy as OrderBy<City>;

    test("== & ==", () => {
      const cs = [
        where("capital", "==", true as const),
        where("population", "==", 1000 as const),
      ] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Extends<T, { population: 1000; capital: true }>>;
      expect(() => query(cities, ...cs)).not.toThrow();
    });

    test("< & == is OK. field exists", () => {
      const cs = [
        where("population", "<", 1000),
        where("capital", "==", true),
      ] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Extends<T, { population: number; capital: boolean }>>;
      expect(() => fst.getDocs(query(cities, ...cs))).not.toThrow();
    });

    test("population > 1000 & population < 2000 is OK", () => {
      const cs = [
        where("population", ">", 1000),
        where("population", "<", 2000),
      ] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Extends<T, { population: number }>>;
      expect(() => fst.getDocs(query(cities, ...cs))).not.toThrow();
    });

    test("population > 1000 & name < US is never", () => {
      const cs = [
        where("population", ">", 1000),
        where("name", "<", "US"),
      ] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Never<T>>;
      expect(() => query(cities, ...cs)).toThrow();
    });

    test("!= & not-in is never", () => {
      const cs = [
        where("population", "!=", 1000),
        where("name", "not-in", ["US"]),
      ] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Never<T>>;
      expect(() => query(cities, ...cs)).toThrow();
    });

    test("arr-con & arr-con-any is never", () => {
      const cs = [
        where("regions", "array-contains", ""),
        where("regions", "array-contains-any", ["US"]),
      ] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Never<T>>;
      expect(() => query(cities, ...cs)).toThrow();
    });

    test("population > 123 & orderBy(population) is OK", () => {
      const cs = [
        where("population", ">", 123),
        orderBy("population"),
      ] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Extends<T, { population: number }>>;
    });

    test("population > 123 & orderBy(name) is NG", () => {
      const cs = [where("population", ">", 123), orderBy("name")] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Never<T>>;
      expect(() => fst.getDocs(query(cities, ...cs))).toThrow();
    });

    test(`where(name), orderBy(name), orderBy(population) is OK`, () => {
      const cs = [
        where("name", ">", "ABC"),
        orderBy("name"),
        orderBy("population"),
      ] as const;

      type T = CD<City, typeof cs>;
      type _ = Assert<Extends<T, { name: string }>>;
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
  const where = fst.where as Where<City>;
  expect(() =>
    query(
      collection(DB, "cities", "v1", "cities"),
      where("capital", "==", true)
    )
  ).not.toThrow();
});

test("use fuse.orderBy with firestore.query", () => {
  const orderBy = fst.orderBy as OrderBy<City>;

  expect(() =>
    query(collection(DB, "cities", "v1", "cities"), orderBy("capital"))
  ).not.toThrow();
});

describe(`query with where`, () => {
  const cities = collection(DB, "cities", "v1", "cities");
  const where = fst.where as Where<City>;

  test(`query(where("country", "in", ["USA", "Japan"] as const)) narrows "country"`, async () => {
    const c = where("country", "in", ["USA", "Japan"] as const);
    const q = query(cities, c);
    type D = typeof q extends fst.Query<infer T> ? T : never;
    type _ = Assert<Extends<D, { country: "USA" | "Japan" }>>;
    const querySS = await fst.getDocs(q);
    querySS.forEach((ss) => {
      expect(["USA", "Japan"]).toContain(ss.data().country);
    });
  });

  test(`query(where("country", "not-in", ["USA", "Japan"])) returns Query<City>`, async () => {
    const q = query(cities, where("country", "not-in", ["USA", "Japan"]));
    type _ = Assert<Exact<fst.Query<City>, typeof q>>;
    const querySS = await fst.getDocs(q);
    querySS.forEach((ss) => {
      expect(["USA", "Japan"]).not.toContain(ss.data().country);
    });
  });

  test(`query(where("regions", "array-contains-any", ["west_coast", "east_coast"] as const)) Defined<City, "regions">`, async () => {
    const q = query(
      cities,
      where("regions", "array-contains-any", ["west_coast", "east_coast"])
    );
    type D = typeof q extends fst.Query<infer T> ? T : never;
    type _ = Assert<Extends<D, { regions: string[] }>>;
    const querySS = await fst.getDocs(q);
    querySS.forEach((ss) => {
      const regions = ss.data().regions;
      expect(
        regions?.includes("west_coast") || regions?.includes("east_coast")
      ).toBeTruthy();
    });
  });
});

describe("query with orderBy", () => {
  const cities = collection(DB, "cities");
  const orderBy = fst.orderBy as OrderBy<City>;

  test(`use query with orderBy("population") doesnt throw`, async () => {
    const q = query(cities, orderBy("population"));
    const querySS = await fst.getDocs(q);
    let prev = 0;
    querySS.forEach((ss) => {
      const population = ss.data().population;
      expect(population).toBeGreaterThanOrEqual(prev);
      prev = population ?? prev;
    });
  });

  test(`get cities orderBy("population", "desc")`, async () => {
    const q = query(cities, orderBy("population", "desc"));
    const querySS = await fst.getDocs(q);
    let prev = 100000000;
    querySS.forEach((ss) => {
      const population = ss.data().population;
      expect(population).toBeLessThanOrEqual(prev);
      prev = population ?? prev;
    });
  });
});

describe("use startAt with fuse.query", () => {
  const c = collection(DB, "cities", "v1", "cities");
  const orderBy = fst.orderBy as fuse.OrderBy<City>;
  expect(() => query(c, orderBy("capital"), fst.startAt(1))).not.toThrow();
});

describe("use startAfter with fuse.query", () => {
  const c = collection(DB, "cities", "v1", "cities");
  const orderBy = fst.orderBy as fuse.OrderBy<City>;
  expect(() => query(c, orderBy("name"), fst.startAfter(1))).not.toThrow();
});

describe("use limit with fuse.query", () => {
  const c = collection(DB, "cities", "v1", "cities");
  expect(() => query(c, fst.limit(1))).not.toThrow();
});

describe("use limitToLast with fuse.query", () => {
  const c = collection(DB, "cities", "v1", "cities");
  expect(() => query(c, fst.limitToLast(1))).not.toThrow();
});

describe("use endAt with fuse.query", () => {
  const c = collection(DB, "cities", "v1", "cities");
  const orderBy = fst.orderBy as fuse.OrderBy<City>;
  expect(() => query(c, orderBy("name"), fst.endAt(1))).not.toThrow();
});

describe("use endBefore with fuse.query", () => {
  const c = collection(DB, "cities", "v1", "cities");
  const orderBy = fst.orderBy as fuse.OrderBy<City>;
  expect(() => query(c, orderBy("name"), fst.endBefore(1))).not.toThrow();
});
