import * as fs from "firebase/firestore";
import * as fuse from ".";
import { initializeApp } from "firebase/app";

const app = initializeApp({ projectId: "pid" });
export const DB = fs.getFirestore(app);
fs.connectFirestoreEmulator(DB, "localhost", 8080);

export type User = {
  name: string;
  age: number;
};
export type Payment = {
  cardNumber: number;
};
export type Room = {
  size: number;
  rooms: {
    living: number;
    dining: number;
    kitchen: number;
  };
};

export type C1 = {
  c1: "c1";
};

export type C2 = {
  c2: "c2";
};

export type C3 = {
  c3: "c3";
  c31: { c32: { c33: string; c33_2: number } };
};

export type MySchema = {
  user: fuse.Collection<User, { payment: fuse.Collection<Payment> }>;
  room: fuse.Collection<Room>;
  C1: fuse.Collection<
    C1,
    { C2: fuse.Collection<C2, { C3: fuse.Collection<C3> }> }
  >;
  cities: fuse.Collection<City>;
};
export type City = {
  name: string;
  state: string | null;
  country: string;
  capital?: boolean;
  population?: number;
  regions?: string[];
};

export type Extends<E, A> = A extends E ? true : false;
export type NotExtends<E, A> = A extends E ? false : true;
export type Assert<T extends true> = T;

export const collection = fuse.collection<MySchema>();
export const doc = fuse.doc<MySchema>();
const { query } = fuse;
export { query };

afterAll(async () => {
  await fs.terminate(DB);
});
test("confirm is emulator running", async () => {
  const colRef = fs.collection(DB, "a/b/c");
  expect(colRef.id).toBe("c");
  expect(colRef.parent?.parent.id).toBe("a");
  const data = { test: "test" };
  const doc = await fs.addDoc(colRef, data);

  const savedRef = await fs.getDoc(doc);
  expect(savedRef.data()).toEqual(data);
});

describe("Add Data", () => {
  test("create docRef with specifing docId", async () => {
    const LARef: fs.DocumentReference<City> = doc(DB, "cities", "LA");
    const data = {
      name: "Los Angeles",
      state: "CA",
      country: "USA",
    };
    await fs.setDoc(LARef, data);
    const LASS = await fs.getDoc(LARef);
    expect(LASS.data()).toEqual(data);
  });

  test("create documentRef using collectionRef", async () => {
    const newCityRef: fs.DocumentReference<City> = doc(
      collection(DB, "cities")
    );
    const data = {
      name: "Los Angeles",
      state: "CA",
      country: "USA",
    };
    await fs.setDoc(newCityRef, data);
    const savedDoc = await fs.getDoc(newCityRef);
    expect(savedDoc.data()).toEqual(data);
  });
});
describe("collection", () => {
  test("add nested collection & read", async () => {
    const paymentRef: fs.CollectionReference<Payment> = collection(
      DB,
      "user",
      "a",
      "payment"
    );
    expect(paymentRef.path).toBe("user/a/payment");
    const payment: Payment = { cardNumber: 1234 };
    const docRef = await fs.addDoc(paymentRef, payment);

    const savedDoc = await fs.getDoc(docRef);
    expect(savedDoc.data()).toEqual(payment);
  });
});

describe("read data once", () => {
  const addDataEntries: Record<string, City> = {
    SF: {
      name: "San Francisco",
      state: "CA",
      country: "USA",
      capital: false,
      population: 860000,
      regions: ["west_coast", "norcal"],
    },
    LA: {
      name: "Los Angeles",
      state: "CA",
      country: "USA",
      capital: false,
      population: 3900000,
      regions: ["west_coast", "socal"],
    },
    DC: {
      name: "Washington, D.C.",
      state: null,
      country: "USA",
      capital: true,
      population: 680000,
      regions: ["east_coast"],
    },
    TOK: {
      name: "Tokyo",
      state: null,
      country: "Japan",
      capital: true,
      population: 9000000,
      regions: ["kanto", "honshu"],
    },
    BJ: {
      name: "Beijing",
      state: null,
      country: "China",
      capital: true,
      population: 21500000,
      regions: ["jingjinji", "hebei"],
    },
  };
  const citiesRef: fs.CollectionReference<City> = collection(DB, "cities");

  beforeAll(async () => {
    for (const [k, v] of Object.entries(addDataEntries)) {
      await fs.setDoc(doc(citiesRef, k), v);
    }
  });

  test("get one document", async () => {
    const docRef: fs.DocumentReference<City> = doc(DB, "cities", "SF");
    const docSnap = await fs.getDoc(docRef);
    expect(docSnap.exists()).toBeTruthy();
  });

  describe("where", () => {
    type Constraints = fuse.AllowedConstraints<City>;
    const where = fuse.where<City>();

    test("use fuse.where with firestore.query", () => {
      fs.query(collection(DB, "user"), where("capital", "==", true));
    });

    test("where(capital, ==, true) is OK", async () => {
      const c = where("capital", "==", true);
      type _ = Assert<Extends<Constraints, [typeof c]>>;

      const q: fs.Query<City> = query(collection(DB, "cities"), c);

      const querySnapshot = await fs.getDocs(q);
      querySnapshot.forEach((doc) => {
        expect(doc.data()).toEqual(addDataEntries[doc.id]);
      });
    });
    test(`where("regions", "array-contains", "west_coast") is OK`, async () => {
      const w = where("regions", "array-contains", "west_coast");
      type _ = Assert<
        Extends<{ _field: string; _op: string; _value: string }, typeof w>
      >;
      type __ = Assert<
        Extends<
          fuse.WhereConstraint<City, "regions", "array-contains", string>,
          typeof w
        >
      >;
      type ___ = Assert<Extends<Constraints, [typeof w]>>;
      const q: fs.Query<City> = query(collection(DB, "cities"), w);
      const docs = await fs.getDocs(q);
      expect(
        docs.docs.every((doc) => doc.data().regions?.includes("west_coast"))
      ).toBeTruthy();
    });

    test(`where("country", "in", ["USA", "Japan"]) is OK`, async () => {
      const c = where("country", "in", ["USA", "Japan"]);
      const q: fs.Query<City> = query(collection(DB, "cities"), c);
      const querySS = await fs.getDocs(q);
      querySS.forEach((ss) => {
        expect(["USA", "Japan"]).toContain(ss.data().country);
      });
    });

    test(`get cities where("country", "not-in", ["USA", "Japan"])`, async () => {
      const q: fs.Query<City> = fs.query(
        collection(DB, "cities"),
        where("country", "not-in", ["USA", "Japan"])
      );
      const querySS = await fs.getDocs(q);
      querySS.forEach((ss) => {
        expect(["USA", "Japan"]).not.toContain(ss.data().country);
      });
    });

    test(`get cities where("regions", "array-contains-any", ["west_coast", "east_coast"])`, async () => {
      const q: fs.Query<City> = query(
        collection(DB, "cities"),
        where("regions", "array-contains-any", ["west_coast", "east_coast"])
      );
      const querySS = await fs.getDocs(q);
      querySS.forEach((ss) => {
        const regions = ss.data().regions;
        expect(
          regions?.includes("west_coast") || regions?.includes("east_coast")
        ).toBeTruthy();
      });
    });
  });

  describe("orderBy", () => {
    const citiesRef: fs.CollectionReference<City> = collection(DB, "cities");
    const orderBy = fuse.orderBy<City>();
    test(`get cities orderBy("population")`, async () => {
      const q = query(citiesRef, orderBy("population"));
      const querySS = await fs.getDocs(q);
      let prev = 0;
      querySS.forEach((ss) => {
        const population = ss.data().population;
        expect(population).toBeGreaterThanOrEqual(prev);
        prev = population ?? prev;
      });
    });

    test(`get cities orderBy("population")`, async () => {
      const q: fs.Query<City> = fs.query(
        citiesRef,
        orderBy("population", "desc")
      );
      const querySS = await fs.getDocs(q);
      let prev = 100000000;
      querySS.forEach((ss) => {
        const population = ss.data().population;
        expect(population).toBeLessThanOrEqual(prev);
        prev = population ?? prev;
      });
    });
  });
});

describe("LegalValue", () => {
  test("(string | null)[] array-contains string | null", () => {
    type T = {
      a: (string | null)[];
    };
    type W = fuse.LegalValue<T, "a", "array-contains">;
    type _ = Assert<Extends<T["a"][number], W>>;
  });
  test("(string | null)[]| undefined array-contains string | null", () => {
    type T = {
      a?: (string | null)[];
    };
    type W = fuse.LegalValue<T, "a", "array-contains">;
    type _ = Assert<Extends<string | null, W>>;
  });

  test("string | null", () => {
    type V = fuse.LegalValue<City, "state", "==">;
    type _ = Assert<Extends<string | null, V>>;
  });
});

describe("OrConstraints", () => {
  test("array-contains-any appear only in array field", () => {
    type Model = {
      A: string[];
      B: number;
    };
    type E =
      | fuse.WhereConstraint<Model, "A", "array-contains-any", string[]>
      | fuse.WhereConstraint<Model, "A", "in", string[][]>
      | fuse.WhereConstraint<Model, "B", "in", number[]>
      | fuse.WhereConstraint<Model, "B", "not-in", number[]>;
    type A = fuse.OrConstraints<Model, "B">;

    type _ = Assert<Extends<E, A>>;
  });

  test("remove undefined in optional field ", () => {
    type Model = {
      C?: ("a" | "b" | "v")[];
    };
    type E =
      | fuse.WhereConstraint<
          Model,
          "C",
          "array-contains-any",
          ("a" | "b" | "v")[]
        >
      | fuse.WhereConstraint<Model, "C", "in", ("a" | "b" | "v")[][]>
      | fuse.WhereConstraint<Model, "C", "not-in", ("a" | "b" | "v")[][]>;
    type A = fuse.OrConstraints<Model, "C">;
    type _ = Assert<Extends<E, A>>;
    type __ = Assert<Extends<A, E>>;
  });
});
