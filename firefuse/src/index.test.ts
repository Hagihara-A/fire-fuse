import * as fs from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { Defined, Schema } from "./index.js";
import { Doc } from "./doc.js";
import { Collection } from "./collection.js";
import * as fst from "firebase/firestore";

const app = initializeApp({ projectId: "pid" });
export const DB = fs.getFirestore(app);
fs.connectFirestoreEmulator(DB, "localhost", 8080);

export type MySchema = {
  user: {
    [DocKey: string]: {
      doc: User | Count;
      col?: {
        favRooms: { [DocKey: string]: { doc: Room } };
      };
    };
    count: {
      doc: Count;
    };
  };
  cities: {
    v1: {
      doc: Record<string, never>;
      col: {
        cities: {
          [DocKey: string]: { doc: City };
        };
      };
    };
    v2: {
      doc: Record<string, never>;
      col: {
        cities: {
          [DocKey: string]: { doc: CityV2 };
        };
      };
    };
  };
};

export type User = {
  name: string;
  age: number;
  sex: "male" | "female" | "other";
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

export type Count = {
  allDocumentCount?: number;
};

export type City = {
  name: string;
  state: string | null;
  country: string;
  capital?: boolean;
  population?: number;
  regions?: string[];
};

export type CityV2 = {
  name: string;
  state: string | null;
  country: string;
  capital?: boolean;
  population?: number;
  regions?: string[];
  history: {
    createdAt: fst.Timestamp;
    updatedAt?: fst.Timestamp[];
  };
  cityV1Ref?: fs.DocumentReference<City>;
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

export const doc = fs.doc as unknown as Doc<MySchema>;
export const collection = fs.collection as unknown as Collection<MySchema>;

afterAll(async () => {
  await fs.terminate(DB);
});

test(`Defined<{a?: string}, "a"> is {a: string}`, () => {
  type T = Defined<{ a?: string }, "a">;
  type _ = Assert<Exact<{ a: string }, T>>;
});

test(`MySchema extends Schema`, () => {
  type _ = Assert<Extends<MySchema, Schema>>;
});
