import * as fs from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { Defined } from "./index.js";

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
  city: fs.DocumentReference<City>;
};
export type TsTestData = {
  ts: fs.Timestamp;
};

export type MySchema = {
  user: {
    doc: User;
    subcollection: {
      payment: { doc: Payment };
    };
  };
  room: {
    doc: Room;
  };
  cities: {
    doc: City;
  };
  ts: {
    doc: TsTestData;
  };
};

export type City = {
  name: string;
  state: string | null;
  country: string;
  capital?: boolean;
  population?: number;
  regions?: string[];
};

export type Extends<A, E> = [A] extends [E] ? true : false;
export type NotExtends<A, E> = [A] extends [E] ? false : true;
export type Exact<A, B> = [A] extends [B]
  ? [B] extends [A]
    ? true
    : false
  : false;
export type Match<E, A extends E> = Exact<E, Pick<A, keyof E>>;
export type Never<T> = T extends never ? true : false;

export type Assert<T extends true> = T;

afterAll(async () => {
  await fs.terminate(DB);
});

beforeAll(async () => {
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
  const batch = fs.writeBatch(DB);
  for (const [k, ent] of Object.entries(addDataEntries)) {
    batch.set(fs.doc(fs.collection(DB, "cities")), ent);
  }
  await batch.commit();
});
test(`Defined<{a?: string}, "a"> is {a: string}`, () => {
  type T = Defined<{ a?: string }, "a">;
  type _ = Assert<Exact<{ a: string }, T>>;
});
