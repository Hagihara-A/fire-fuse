import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  addDoc,
  getDoc,
  terminate,
  setDoc,
} from "firebase/firestore";
import * as fuse from "./index";
import { Collection } from ".";

import { initializeApp } from "firebase/app";
const app = initializeApp({ projectId: "pid" });
const DB = getFirestore(app);
connectFirestoreEmulator(DB, "localhost", 8080);

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
  user: Collection<User, { payment: Collection<Payment> }>;
  room: Collection<Room>;
  C1: Collection<C1, { C2: Collection<C2, { C3: Collection<C3> }> }>;
};

const fcollection = fuse.collection<MySchema>();
const fdoc = fuse.doc<MySchema>();
afterAll(async () => {
  await terminate(DB);
});

test("confirm is emulator running", async () => {
  const colRef = collection(DB, "a/b/c");
  expect(colRef.id).toBe("c");
  expect(colRef.parent.parent.id).toBe("a");
  const data = { test: "test" };
  const doc = await addDoc(colRef, data);

  const savedRef = await getDoc(doc);
  expect(savedRef.data()).toEqual(data);
});

describe("collection", () => {
  test("add nested collection & read", async () => {
    const paymentRef = fcollection(DB, "user", "a", "payment");
    expect(paymentRef.path).toBe("user/a/payment");
    const payment: Payment = { cardNumber: 1234 };
    const docRef = await addDoc(paymentRef, payment);

    const savedDoc = await getDoc(docRef);
    expect(savedDoc.data()).toEqual(payment);
  });
});

describe("doc", () => {
  test("create nested document & read it", async () => {
    const docRef = fdoc(DB, "user", "a", "payment", "b");
    expect(docRef.id).toBe("b");

    const data = { cardNumber: 1234 };
    await setDoc(docRef, data);

    const savedDoc = await getDoc(docRef);
    expect(savedDoc.data()).toEqual(data);
  });

  test("update nested doc partially", async () => {
    const docRef = fdoc(DB, "C1", "c1", "C2", "c2", "C3", "c3");
    expect(docRef.id).toBe("c3");

    const data = {
      c3: "c3",
      c31: { c32: { c33: "c33", c33_2: 123 } },
    };
    await setDoc(docRef, data);
    await fuse.updateDoc(docRef, { "c31.c32.c33": "update" });
    const updatedData = (await getDoc(docRef)).data();
    const expectedData: C3 = {
      c3: "c3",
      c31: { c32: { c33: "update", c33_2: 123 } },
    };
    expect(updatedData).toEqual(expectedData);
  });

  test("overwrite nested value", async () => {
    const docRef = fdoc(DB, "C1", "c1", "C2", "c2", "C3", "c3");
    expect(docRef.id).toBe("c3");

    const data = {
      c3: "c3",
      c31: { c32: { c33: "c33", c33_2: 123 } },
    };
    await setDoc(docRef, data);
    await fuse.updateDoc(docRef, {
      c31: { c32: { c33: "update", c33_2: 321 } },
    });
    const updatedData = (await getDoc(docRef)).data();
    const expectedData: C3 = {
      c3: "c3",
      c31: { c32: { c33: "update", c33_2: 321 } },
    };
    expect(updatedData).toEqual(expectedData);
  });

  test("disapper unspecified value of nested object", async () => {
    const docRef = fdoc(DB, "C1", "c1", "C2", "c2", "C3", "c3");
    expect(docRef.id).toBe("c3");

    const data = {
      c3: "c3",
      c31: { c32: { c33: "c33", c33_2: 123 } },
    };
    await setDoc(docRef, data);
    await fuse.updateDoc(docRef, {
      c31: { c32: { c33: "update" } },
    });
    const updatedData = (await getDoc(docRef)).data();
    const expectedData: C3 = {
      c3: "c3",
      c31: { c32: { c33: "update", c33_2: undefined } },
    };
    expect(updatedData).toEqual(expectedData);
  });
});
