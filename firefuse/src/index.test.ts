import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  addDoc,
  getDoc,
  terminate,
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
};
type C1 = {
  c1: "c1";
};

type C2 = {
  c2: "c2";
};

type C3 = {
  c3: "c3";
};

type MySchema = {
  user: Collection<User, { payment: Collection<Payment> }>;
  room: Collection<Room>;
  C1: Collection<C1, { C2: Collection<C2, { C3: Collection<C3> }> }>;
};
afterAll(async () => {
  await terminate(DB);
});
test("collection.add", async () => {
  const colRef = collection(DB, "a/b/c");
  const data = { test: "test" };
  const doc = await addDoc(colRef, data);

  const savedRef = await getDoc(doc);
  expect(savedRef.data()).toEqual(data);
});

describe("collection", () => {
  test("add shallow collection & read", async () => {
    const fcollection = fuse.collection<MySchema>();

    const paymentRef = fcollection(DB, "user", "a", "payment");
    const payment: Payment = { cardNumber: 1234 };
    const docRef = await addDoc(paymentRef, payment);

    const savedDoc = await getDoc(docRef);
    expect(savedDoc.data()).toEqual(payment);
  });
});
