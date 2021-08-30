import * as fs from "firebase/firestore";
import * as fuse from ".";
import { initializeApp } from "firebase/app";

const app = initializeApp({ projectId: "pid" });
const DB = fs.getFirestore(app);
fs.connectFirestoreEmulator(DB, "localhost", 8080);

type User = {
  name: string;
  age: number;
};
type Payment = {
  cardNumber: number;
};
type Room = {
  size: number;
  rooms: {
    living: number;
    dining: number;
    kitchen: number;
  };
};

type C1 = {
  c1: "c1";
};

type C2 = {
  c2: "c2";
};

type C3 = {
  c3: "c3";
  c31: { c32: { c33: string; c33_2: number } };
};

type MySchema = {
  user: fuse.Collection<User, { payment: fuse.Collection<Payment> }>;
  room: fuse.Collection<Room>;
  C1: fuse.Collection<
    C1,
    { C2: fuse.Collection<C2, { C3: fuse.Collection<C3> }> }
  >;
  cities: fuse.Collection<City>;
};
type City = {
  name: string;
  state: string | null;
  country: string;
  capital?: boolean;
  population?: number;
  regions?: string[];
};

type Extends<E, A> = A extends E ? true : false;
type NotExtends<E, A> = A extends E ? false : true;
type Assert<T extends true> = T;

const collection = fuse.collection<MySchema>();
const doc = fuse.doc<MySchema>();
afterAll(async () => {
  await fs.terminate(DB);
});
test("confirm is emulator running", async () => {
  const colRef = fs.collection(DB, "a/b/c");
  expect(colRef.id).toBe("c");
  expect(colRef.parent.parent.id).toBe("a");
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
    test("get cities where(capital, ==, true)", async () => {
      const where = fuse.where<City>();
      const q: fs.Query<City> = fs.query(
        collection(DB, "cities"),
        where("capital", "==", true)
      );

      const querySnapshot = await fs.getDocs(q);
      querySnapshot.forEach((doc) => {
        expect(doc.data()).toEqual(addDataEntries[doc.id]);
      });
    });

    test(`get cities where("regions", "array-contains", "west_coast")`, async () => {
      const where = fuse.where<City>();
      const _: { type: "where" } = where(
        "regions",
        "array-contains",
        "west_coast"
      );
      const q: fs.Query<City> = fs.query(
        collection(DB, "cities"),
        where("regions", "array-contains", "west_coast")
      );
      const docs = await fs.getDocs(q);
      expect(
        docs.docs.every((doc) => doc.data().regions.includes("west_coast"))
      ).toBeTruthy();
    });

    test(`get cities where("country", "in", ["USA", "Japan"]) `, async () => {
      const where = fuse.where<City>();
      const q: fs.Query<City> = fs.query(
        collection(DB, "cities"),
        where("country", "in", ["USA", "Japan"])
      );
      const querySS = await fs.getDocs(q);
      querySS.forEach((ss) => {
        expect(["USA", "Japan"]).toContain(ss.data().country);
      });
    });

    test(`get cities where("country", "not-in", ["USA", "Japan"])`, async () => {
      const where = fuse.where<City>();
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
      const where = fuse.where<City>();
      const q: fs.Query<City> = fs.query(
        collection(DB, "cities"),
        where("regions", "array-contains-any", ["west_coast", "east_coast"])
      );
      const querySS = await fs.getDocs(q);
      querySS.forEach((ss) => {
        const regions = ss.data().regions;
        expect(
          regions.includes("west_coast") || regions.includes("east_coast")
        ).toBeTruthy();
      });
    });
  });

  test("create nested document & read it", async () => {
    const docRef: fs.DocumentReference<Payment> = doc(
      DB,
      "user",
      "a",
      "payment",
      "b"
    );
    expect(docRef.id).toBe("b");

    const data = { cardNumber: 1234 };
    await fs.setDoc(docRef, data);

    const savedDoc = await fs.getDoc(docRef);
    expect(savedDoc.data()).toEqual(data);
  });

  test("update nested doc partially", async () => {
    const docRef: fs.DocumentReference<C3> = doc(
      DB,
      "C1",
      "c1",
      "C2",
      "c2",
      "C3",
      "c3"
    );
    expect(docRef.id).toBe("c3");

    const data = {
      c3: "c3",
      c31: { c32: { c33: "c33", c33_2: 123 } },
    };
    await fs.setDoc(docRef, data);
    await fs.updateDoc(docRef, { "c31.c32.c33": "update" });
    const updatedData = (await fs.getDoc(docRef)).data();
    const expectedData: C3 = {
      c3: "c3",
      c31: { c32: { c33: "update", c33_2: 123 } },
    };
    expect(updatedData).toEqual(expectedData);
  });

  test("overwrite nested value", async () => {
    const docRef: fs.DocumentReference<C3> = doc(
      DB,
      "C1",
      "c1",
      "C2",
      "c2",
      "C3",
      "c3"
    );
    expect(docRef.id).toBe("c3");

    const data = {
      c3: "c3",
      c31: { c32: { c33: "c33", c33_2: 123 } },
    };
    await fs.setDoc(docRef, data);
    await fs.updateDoc(docRef, {
      c31: { c32: { c33: "update", c33_2: 321 } },
    });
    const updatedData = (await fs.getDoc(docRef)).data();
    const expectedData: C3 = {
      c3: "c3",
      c31: { c32: { c33: "update", c33_2: 321 } },
    };
    expect(updatedData).toEqual(expectedData);
  });

  test("disapper unspecified value of nested object", async () => {
    const docRef: fs.DocumentReference<C3> = doc(
      DB,
      "C1",
      "c1",
      "C2",
      "c2",
      "C3",
      "c3"
    );
    expect(docRef.id).toBe("c3");

    const data = {
      c3: "c3",
      c31: { c32: { c33: "c33", c33_2: 123 } },
    };
    await fs.setDoc(docRef, data);
    await fs.updateDoc(docRef, {
      c31: { c32: { c33: "update" } },
    });
    const updatedData = (await fs.getDoc(docRef)).data();
    const expectedData: C3 = {
      c3: "c3",
      c31: { c32: { c33: "update", c33_2: undefined } },
    };
    expect(updatedData).toEqual(expectedData);
  });

  describe("orderBy", () => {
    const citiesRef: fs.CollectionReference<City> = collection(DB, "cities");
    const orderBy = fuse.orderBy<City>();
    test(`get cities orderBy("population")`, async () => {
      const q = fs.query(citiesRef, orderBy("population"));
      const querySS = await fs.getDocs(q);
      let prev = 0;
      querySS.forEach((ss) => {
        const population = ss.data().population;
        expect(population).toBeGreaterThanOrEqual(prev);
        prev = population;
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
        prev = population;
      });
    });
  });
});

describe("multple queries", () => {
  const where = fuse.where<City>();
  const orderBy = fuse.orderBy<City>();
  type Constraints = fuse.AllowedConstraints<City>;

  test("population > 10000 & state == CA is valid", () => {
    const constraints: Constraints = [
      where("population", ">", 10000),
      where("state", "==", "CA"),
    ] as const;
    type _ = Assert<Extends<Constraints, typeof constraints>>;
  });

  test("== && > is not valid", () => {
    const constraints = [
      where("state", "==", "CA"),
      where("population", ">", 10000),
    ] as const;
    type _ = Assert<NotExtends<Constraints, typeof constraints>>;
  });

  test("!= && not-in is not valid", () => {
    const constraints = [
      where("state", "!=", "CA"),
      where("state", "not-in", ["ABC"]),
    ] as const;
    type _ = Assert<NotExtends<Constraints, typeof constraints>>;
  });

  test("not-in && in && >= && == && orderBy && ...otherConstraints is valid", () => {
    const constraints = [
      where("state", "not-in", ["ABC"]),
      where("state", "in", ["CA"]),
      where("state", ">=", "ABC"),
      where("capital", "==", true),
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

  test("state >= CA & population > 10000 is not valid", () => {
    const constraints = [
      where("state", ">=", "CA"),
      where("population", ">", 100000),
    ] as const;
    type _ = Assert<NotExtends<Constraints, typeof constraints>>;
  });

  test("!= should be first", () => {
    const constraints = [
      where("state", ">=", "CA"),
      where("capital", "!=", true),
    ] as const;
    type _ = Assert<NotExtends<Constraints, typeof constraints>>;
  });

  test("not-in should be first", () => {
    const constraints = [
      where("state", ">=", "CA"),
      where("state", "not-in", ["CA"]),
    ] as const;
    type _ = Assert<NotExtends<Constraints, typeof constraints>>;
  });

  test("4 compare is not valid", () => {
    const constraints = [
      where("state", ">=", "CA"),
      where("state", ">=", "CA"),
      where("state", ">=", "CA"),
      where("state", ">=", "CA"),
    ] as const;
    type _ = Assert<NotExtends<Constraints, typeof constraints>>;
  });

  test("1 compare is not valid", () => {
    const constraints = [where("state", ">=", "CA")] as const;
    type _ = Assert<Extends<Constraints, typeof constraints>>;
  });
});
