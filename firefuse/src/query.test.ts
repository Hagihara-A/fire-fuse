import * as fs from "firebase/firestore";
import * as fuse from ".";
import {
  City,
  Assert,
  Extends,
  NotExtends,
  collection,
  DB,
  Exact,
} from "./index.test";

const where = fuse.where<City>();
const orderBy = fuse.orderBy<City>();
const cities = collection(DB, "cities");

describe("single constraint is OK", () => {
  type Constraints = fuse.AllowedConstraints<City>;
  test("no constraint is OK", () => {
    type _ = Assert<Extends<Constraints, []>>;
  });

  test("== is OK", () => {
    const w = where("name", "==", "ABC");
    type _ = Assert<Extends<Constraints, [typeof w]>>;
  });

  test("!= is OK", () => {
    const w = where("name", "!=", "ABC");
    type _ = Assert<Extends<Constraints, [typeof w]>>;
  });

  test("> is OK", () => {
    const w = where("name", ">", "ABC");
    type _ = Assert<Extends<Constraints, [typeof w]>>;
  });

  test("array-contains is OK", () => {
    const w = where("regions", "array-contains", "ABC");
    type _ = Assert<Extends<Constraints, [typeof w]>>;
  });

  test("array-contains-any is OK", () => {
    const w = where("regions", "array-contains-any", ["ABC"]);
    type _ = Assert<Extends<Constraints, [typeof w]>>;
  });

  test("in is OK", () => {
    const w = where("name", "in", ["ABC"]);
    type _ = Assert<Extends<Constraints, [typeof w]>>;
  });

  test("not-in is OK", () => {
    const w = where("name", "not-in", ["ABC"]);
    type _ = Assert<Extends<Constraints, [typeof w]>>;
  });

  test("orderBy is OK", () => {
    const o = orderBy("name");
    type _ = Assert<Extends<Constraints, [typeof o]>>;
  });

  test("limit is OK", () => {
    const l = fuse.limit(3);
    type _ = Assert<Extends<Constraints, [typeof l]>>;
  });
});

describe("multple constraints", () => {
  type Constraints = fuse.AllowedConstraints<City>;

  test("== & == is OK", () => {
    const constraints = [
      where("state", "==", "CA"),
      where("population", "==", 10000),
    ] as const;
    type _ = Assert<Extends<Constraints, typeof constraints>>;
  });

  test(" == & >  is OK", () => {
    const constraints: Constraints = [
      where("state", "==", "CA"),
      where("population", ">", 10000),
    ] as const;
    type _ = Assert<Extends<Constraints, typeof constraints>>;
  });

  test("== & > is NG", () => {
    const constraints = [
      where("state", "==", "CA"),
      where("population", ">", 10000),
    ] as const;
    type _ = Assert<Extends<Constraints, typeof constraints>>;
  });

  test("TODO: arr-con & arr-con-any is NG", () => {
    const constraints = [
      where("regions", "array-contains", "CA"),
      where("regions", "array-contains-any", ["ABC"]),
    ] as const;
    // type _ = Assert<NotExtends<Constraints, typeof constraints>>;

    expect(() => fs.getDocs(fs.query(cities, ...constraints))).toThrow();
  });

  test("TODO: != & not-in is NG", () => {
    const constraints = [
      where("state", "!=", "CA"),
      where("state", "not-in", ["ABC"]),
    ] as const;
    // type _ = Assert<Extends<Constraints, typeof constraints>>;
    expect(() => fs.getDocs(fs.query(cities, ...constraints))).toThrow();
  });

  test("not-in & in & >= & == && orderBy && ...otherConstraints is valid", () => {
    const constraints: Constraints = [
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
    type _ = Assert<Extends<Constraints, typeof constraints>>;
  });

  test("state >= A & population > B is NG", () => {
    const constraints = [
      where("state", ">=", "CA"),
      where("population", ">", 100000),
    ] as const;
    type _ = Assert<NotExtends<Constraints, typeof constraints>>;
    expect(() => fs.getDocs(fs.query(cities, ...constraints))).toThrow();
  });

  test(">= & != is NG", () => {
    const constraints = [
      where("state", ">=", "CA"),
      where("capital", "!=", true),
    ] as const;
    type _ = Assert<NotExtends<Constraints, typeof constraints>>;
    expect(() => fs.getDocs(fs.query(cities, ...constraints))).toThrow();
  });

  test(">= & not-in is NG", () => {
    const constraints = [
      where("population", ">=", 123),
      where("state", "not-in", ["CA"]),
    ] as const;
    type _ = Assert<NotExtends<Constraints, typeof constraints>>;
    expect(() => fs.getDocs(fs.query(cities, ...constraints))).toThrow();
  });

  test(">= & >= & >= & >= is NG", () => {
    const constraints = [
      where("state", ">=", "CA"),
      where("state", ">=", "CA"),
      where("state", ">=", "CA"),
      where("state", ">=", "CA"),
    ] as const;
    type _ = Assert<NotExtends<Constraints, typeof constraints>>;
  });

  test(">= is OK", () => {
    const constraints = [where("state", ">=", "CA")] as const;
    type _ = Assert<Extends<Constraints, typeof constraints>>;
  });

  test("not-in & in is NG", () => {
    const constraints = [
      where("name", "not-in", ["A", "B"]),
      where("name", "in", ["A", "B"]),
    ] as const;
    type _ = Assert<NotExtends<Constraints, typeof constraints>>;
    expect(() => fs.getDocs(fs.query(cities, ...constraints))).toThrow();
  });

  test("in & arr-contains-any is NG", () => {
    const constraints = [
      where("name", "in", ["A", "B"]),
      where("regions", "array-contains-any", ["A", "B"]),
    ] as const;
    type _ = Assert<NotExtends<Constraints, typeof constraints>>;
    expect(() => fs.getDocs(fs.query(cities, ...constraints))).toThrow();
  });

  test("not-in & arr-contains-any is NG", () => {
    const constraints = [
      where("name", "not-in", ["A", "B"]),
      where("regions", "array-contains-any", ["A", "B"]),
    ] as const;
    type _ = Assert<NotExtends<Constraints, typeof constraints>>;
    expect(() => fs.getDocs(fs.query(cities, ...constraints))).toThrow();
  });

  test("arr-con-any & arr-con is NG", () => {
    const constraints = [
      where("regions", "array-contains-any", ["A", "B"]),
      where("regions", "array-contains", "A"),
    ] as const;
    type _ = Assert<NotExtends<Constraints, typeof constraints>>;
    expect(() => fs.getDocs(fs.query(cities, ...constraints))).toThrow();
  });

  test("arr-con & arr-con is NG", () => {
    const constraints = [
      where("regions", "array-contains-any", ["A", "B"]),
      where("regions", "array-contains", "A"),
    ] as const;
    type _ = Assert<NotExtends<Constraints, typeof constraints>>;
    expect(() => fs.getDocs(fs.query(cities, ...constraints))).toThrow();
  });

  test(`population <= 123 & name not-in ["USA"] is NG`, () => {
    const constraints = [
      where("population", "<=", 123),
      where("name", "not-in", ["USA"]),
    ] as const;
    type _ = Assert<NotExtends<Constraints, typeof constraints>>;
    expect(() => fs.getDocs(fs.query(cities, ...constraints))).toThrow();
  });

  test("population > 123 & orderBy(population) is OK", () => {
    const constraints = [
      where("population", ">", 123),
      orderBy("population"),
    ] as const;
    type _ = Assert<Extends<Constraints, typeof constraints>>;
  });

  test("population > 123 & orderBy(name) is NG", () => {
    const constraints = [
      where("population", ">", 123),
      orderBy("name"),
    ] as const;
    type _ = Assert<NotExtends<Constraints, typeof constraints>>;
    expect(() => fs.getDocs(fs.query(cities, ...constraints))).toThrow();
  });

  test(`where(name), orderBy(name), orderBy(population) is OK`, () => {
    const constraints = [
      where("name", ">", "ABC"),
      orderBy("name"),
      orderBy("population"),
    ] as const;
    type _ = Assert<Extends<Constraints, typeof constraints>>;
  });
});

import { ConstrainedData as CD } from ".";
describe("ConstraintedData", () => {
  const cities = collection(DB, "cities");

  describe("single constraint", () => {
    test("field of > exists", () => {
      const cs = [where("population", ">=", 1000)] as const;
      type T = CD<City, typeof cs>;

      type _ = Assert<Extends<{ population: number }, T>>;
    });

    test("field of == exists", () => {
      const cs = [where("capital", "==", true)] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Extends<{ capital: boolean }, T>>;
    });
    
    test("field of != exists", () => {
      const cs = [where("name", "!=", "asd")] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Extends<{ name: string }, T>>;
    });

    test("field of array-contains exists", () => {
      const cs = [where("regions", "array-contains", "asd")] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Exact<{ regions: string[] }, Pick<T, "regions">>>;
    });

    test("field of array-contains-any exists", () => {
      const cs = [where("regions", "array-contains-any", ["asd"])] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Extends<{ regions: string[] }, T>>;
    });

    test("field of in exists", () => {
      const cs = [where("population", "in", [1000, 2000])] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Extends<{ population: number }, T>>;
    });

    test("field of not-in exists", () => {
      const cs = [where("population", "not-in", [1000, 2000])] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Extends<{ population: number }, T>>;
    });
  });

  describe("combinated constraints", () => {
    test("== & ==", () => {
      const cs = [
        where("capital", "==", true),
        where("population", "==", 1000),
      ] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<
        Exact<
          { population: number; capital: boolean },
          Pick<T, "capital" | "population">
        >
      >;
      expect(() => fs.query(cities, ...cs)).not.toThrow();
    });

    test("< & == is OK. field exists", () => {
      const cs = [
        where("population", "<", 1000),
        where("capital", "==", true),
      ] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<
        Exact<
          { population: number; capital: boolean },
          Pick<T, "population" | "capital">
        >
      >;
      expect(() => fs.query(cities, ...cs)).not.toThrow();
    });

    test("population > 1000 & name < US is never", () => {
      const cs = [
        where("population", ">", 1000),
        where("name", "<", "US"),
      ] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Extends<never, T>>;
      expect(() => fs.query(cities, ...cs)).not.toThrow();
    });

    test("!= & not-in is never", () => {
      const cs = [
        where("population", "!=", 1000),
        where("name", "not-in", ["US"]),
      ] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Extends<never, T>>;
      expect(() => fs.query(cities, ...cs)).not.toThrow();
    });

    test("arr-con & arr-con-any is never", () => {
      const cs = [
        where("regions", "array-contains", ""),
        where("regions", "array-contains-any", ["US"]),
      ] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Extends<never, T>>;
      expect(() => fs.query(cities, ...cs)).not.toThrow();
    });
  });
});
