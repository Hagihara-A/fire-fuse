process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";

import * as admin from "firebase-admin";
import * as fuse from "./index.js";

const app = admin.initializeApp({ projectId: "abc" });
export const DB = admin.firestore(app) as fuse.FuseFirestore<MySchema>;

export type User = {
  name: { first: string; last: number; middle?: string };
  age?: number;
  sex?: "male" | "female" | "other";
  birthDay: admin.firestore.Timestamp;
  skills?: string[];
  isStudent: boolean;
};
export type Payment = {
  cardNumber: number;
};
export type Room = {
  size: number;
  rooms?: {
    living?: number;
    dining?: number;
    kitchen?: number;
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
export type Exact<A, B> = Extends<A, B> extends true
  ? Extends<B, A> extends true
    ? true
    : false
  : false;
export type Match<E, A extends E> = Exact<E, Pick<A, keyof E>>;
export type Never<T> = T extends never ? true : false;

export type Assert<T extends true> = T;

describe("Add Data", () => {
  test("create docRef with specifing docId", async () => {
    const LARef = DB.doc("cities/LA");
    const data = {
      name: "Los Angeles",
      state: "CA",
      country: "USA",
    };
    await LARef.set(data);

    const LASS = await LARef.get();
    expect(LASS.data()).toEqual(data);
  });

  test("create documentRef using collectionRef", async () => {
    const newCityRef = DB.collection("cities").doc();
    const data = {
      name: "Los Angeles",
      state: "CA",
      country: "USA",
    };
    await newCityRef.set(data);
    const savedDoc = await newCityRef.get();
    expect(savedDoc.data()).toEqual(data);
  });
});
describe("collection", () => {
  test("add nested collection & read", async () => {
    const paymentRef = DB.collection("user/a/payment");
    expect(paymentRef.path).toBe("user/a/payment");
    const payment: Payment = { cardNumber: 1234 };
    const docRef = await paymentRef.add(payment);

    const savedDoc = await docRef.get();
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
  const citiesRef = DB.collection("cities");

  beforeAll(async () => {
    for (const [k, v] of Object.entries(addDataEntries)) {
      await DB.doc(`cities/${k}`).set(v);
    }
  });

  test("get one document", async () => {
    const docRef = DB.doc("cities/SF");
    const docSnap = await docRef.get();
    expect(docSnap.exists).toBeTruthy();
  });

  describe("LegalValue", () => {
    test("(string | null)[] array-contains string | null", () => {
      type T = {
        a: (string | null)[];
      };
      type W = fuse.LegalValue<T, "a", "array-contains">;
      type _ = Assert<Exact<string | null, W>>;
    });
    test("(string | null)[]| undefined array-contains string | null", () => {
      type T = {
        a?: (string | null)[];
      };
      type W = fuse.LegalValue<T, "a", "array-contains">;
      type _ = Assert<Exact<string | null, W>>;
    });

    test("string | null", () => {
      type V = fuse.LegalValue<City, "state", "==">;
      type _ = Assert<Exact<string | null, V>>;
    });
  });
});

describe(`GetData`, () => {
  test(`GetData<MySchema, ["cities"]> is City`, () => {
    type D = fuse.GetData<MySchema, "cities">;
    type _ = Assert<Exact<D, City>>;
  });
  test(`GetData<MySchema, ["cities", string]> is City`, () => {
    type D = fuse.GetData<MySchema, `cities/${string}`>;
    type _ = Assert<Exact<D, City>>;
  });
});
