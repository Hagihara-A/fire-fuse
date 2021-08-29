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

describe("doc", () => {
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
