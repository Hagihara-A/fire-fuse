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
  level1: {
    level2_1: string[];
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
    const LARef = doc(DB, "cities", "LA");
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
    const newCityRef = doc(collection(DB, "cities"));
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
    const paymentRef = collection(DB, "user", "a", "payment");
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
  beforeAll(async () => {
    const citiesRef = collection(DB, "cities");

    for (const [k, v] of Object.entries(addDataEntries)) {
      await fs.setDoc(doc(citiesRef, k), v);
    }
  });

  test("get one document", async () => {
    const docRef = doc(DB, "cities", "SF");
    const docSnap = await fs.getDoc(docRef);
    expect(docSnap.exists()).toBeTruthy();
  });
  describe("where", () => {
    test("get cities where(capital, ==, true)", async () => {
      const where = fuse.where<City>();
      const q = fs.query(
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
      const q = fs.query(
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
      const q = fs.query(
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
      const q = fs.query(
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
      const q = fs.query(
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
    const docRef = doc(DB, "user", "a", "payment", "b");
    expect(docRef.id).toBe("b");

    const data = { cardNumber: 1234 };
    await fs.setDoc(docRef, data);

    const savedDoc = await fs.getDoc(docRef);
    expect(savedDoc.data()).toEqual(data);
  });

  test("update nested doc partially", async () => {
    const docRef = doc(DB, "C1", "c1", "C2", "c2", "C3", "c3");
    expect(docRef.id).toBe("c3");

    const data = {
      c3: "c3",
      c31: { c32: { c33: "c33", c33_2: 123 } },
    };
    await fs.setDoc(docRef, data);
    await fuse.updateDoc(docRef, { "c31.c32.c33": "update" });
    const updatedData = (await fs.getDoc(docRef)).data();
    const expectedData: C3 = {
      c3: "c3",
      c31: { c32: { c33: "update", c33_2: 123 } },
    };
    expect(updatedData).toEqual(expectedData);
  });

  test("overwrite nested value", async () => {
    const docRef = doc(DB, "C1", "c1", "C2", "c2", "C3", "c3");
    expect(docRef.id).toBe("c3");

    const data = {
      c3: "c3",
      c31: { c32: { c33: "c33", c33_2: 123 } },
    };
    await fs.setDoc(docRef, data);
    await fuse.updateDoc(docRef, {
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
    const docRef = doc(DB, "C1", "c1", "C2", "c2", "C3", "c3");
    expect(docRef.id).toBe("c3");

    const data = {
      c3: "c3",
      c31: { c32: { c33: "c33", c33_2: 123 } },
    };
    await fs.setDoc(docRef, data);
    await fuse.updateDoc(docRef, {
      c31: { c32: { c33: "update" } },
    });
    const updatedData = (await fs.getDoc(docRef)).data();
    const expectedData: C3 = {
      c3: "c3",
      c31: { c32: { c33: "update", c33_2: undefined } },
    };
    expect(updatedData).toEqual(expectedData);
  });
});
