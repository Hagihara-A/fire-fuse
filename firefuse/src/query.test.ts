import * as fst from "firebase/firestore";

import { OrderBy } from "./constraint/orderby.js";
import { Where } from "./constraint/where.js";
import * as fuse from "./index.js";
import { ConstrainedData as CD } from "./index.js";
import {
  Assert,
  City,
  CityV2,
  collection,
  DB,
  doc,
  Exact,
  Match,
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
      expect(() => fst.getDocs(query(cities, ...cs))).not.toThrow();
    });

    test("name not-in string[] is not never", () => {
      const cs = [where("name", "not-in", ["tokyo"])] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Match<{ name: string }, T>>;
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
      type _ = Assert<Match<{ population: 1000; capital: true }, T>>;
      expect(() => query(cities, ...cs)).not.toThrow();
    });

    test("< & == is OK. field exists", () => {
      const cs = [
        where("population", "<", 1000),
        where("capital", "==", true),
      ] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Match<{ population: number; capital: boolean }, T>>;
      expect(() => fst.getDocs(query(cities, ...cs))).not.toThrow();
    });

    test("population > 1000 & population < 2000 is OK", () => {
      const cs = [
        where("population", ">", 1000),
        where("population", "<", 2000),
      ] as const;
      type T = CD<City, typeof cs>;
      type _ = Assert<Match<{ population: number }, T>>;
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

    test("not-in & in & >= & == && orderBy && ...otherConstraints is valid", () => {
      const cs = [
        where("capital", "==", true as const),
        orderBy("state"),
        fuse.limit(3),
        fuse.limitToLast(2),
        fuse.startAt(1000),
        fuse.startAfter(10000),
        fuse.endAt(100000),
        fuse.endBefore(1000000),
      ] as const;

      type T = CD<City, typeof cs>;
      type _ = Assert<Match<{ capital: true }, T>>;
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
      expect(() => fst.getDocs(query(cities, ...cs))).toThrow();
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
    type _ = Assert<Match<{ country: "USA" | "Japan" }, D>>;
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
    type _ = Assert<Match<{ regions: string[] }, D>>;
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

describe(`can get docs which have Timestamp value`, () => {
  const now = fst.Timestamp.now();
  const tss: { ts: fst.Timestamp; ref: fst.DocumentReference<CityV2> }[] = [];
  const n = 10;
  const tsCol = collection(DB, "cities", "v2", "cities");
  const where = fst.where as fuse.Where<CityV2>;
  const orderBy = fst.orderBy as fuse.OrderBy<CityV2>;

  beforeAll(async () => {
    for (let index = 0; index < n; index++) {
      const ts = fst.Timestamp.fromMillis(now.toMillis() + 1000 * 60 * index);
      const ref = doc(tsCol, `${index}`);
      tss.push({ ts, ref });
      await fst.setDoc(ref, {
        createdAt: ts,
        name: "",
        state: "",
        country: "",
      });
    }
  });

  test(`can get docs where("timestamp", "==", Timestamp)`, async () => {
    const { ts, ref } = tss[5];
    const q = query(tsCol, where("createdAt", "==", ts));
    const querySS = await fst.getDocs(q);

    expect(querySS.docs).toHaveLength(1);
    const gotDoc = querySS.docs.find((doc) => doc.data().createdAt.isEqual(ts));
    expect(gotDoc?.ref).toBeInstanceOf(fst.DocumentReference);
    expect(gotDoc?.ref?.path).toBe(ref.path);
  });
  test(`can get docs where("timestamp", "!=", Timestamp)`, async () => {
    const { ts, ref } = tss[5];

    const q = query(tsCol, where("createdAt", "!=", ts));
    const querySS = await fst.getDocs(q);
    expect(querySS.docs).toHaveLength(n - 1);
    expect(
      querySS.docs.every(
        (doc) => doc.ref.path !== ref.path && !doc.data().createdAt.isEqual(ts)
      )
    ).toBeTruthy();
  });
  test(`can get docs where("timestamp", ">=", Timestamp)`, async () => {
    const m = 3;
    const { ref: ref1, ts: before } = tss[m];

    const q = query(ref1.parent, where("createdAt", ">", before));
    const querySS = await fst.getDocs(q);
    expect(
      querySS.docs.every(
        (doc) => doc.data().createdAt.toMillis() > before.toMillis()
      )
    ).toBeTruthy();
    expect(querySS.docs).toHaveLength(n - m - 1);
  });

  test(`Timestample is able to be ordered by orderBy`, async () => {
    const q = query(tsCol, orderBy("createdAt"));
    const { docs } = await fst.getDocs(q);
    let prev = 0;
    expect.assertions(n + 1);
    expect(docs).toHaveLength(n);
    for (const d of docs) {
      const ts = d.data().createdAt;
      expect(prev < ts.toMillis()).toBeTruthy();
      prev = ts.toMillis();
    }
  });
});
