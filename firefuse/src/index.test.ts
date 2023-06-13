import { initializeApp } from "firebase/app";
import * as fst from "firebase/firestore";

import { Collection } from "./collection.js";
import { Doc } from "./doc.js";
import { Schema } from "./index.js";
import { Query } from "./query.js";
import { Defined } from "./utils.js";

const app = initializeApp({ projectId: "pid" });
export const DB = fst.getFirestore(app);
fst.connectFirestoreEmulator(DB, "localhost", 8080);

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
      doc: Empty;
      col: {
        cities: {
          [DocKey: string]: { doc: City };
        };
      };
    };
    v2: {
      doc: Empty;
      col: {
        cities: {
          [DocKey: string]: { doc: CityV2 };
        };
      };
    };
  };
  "l1-c1": {
    [K: string]: {
      doc: Empty;
      col: {
        "l2-c1": { "l2-d1": { doc: L2D1 }; "l2-d2": { doc: L2D2 } };
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
  city: fst.DocumentReference<City>;
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
  createdAt: fst.Timestamp;
  updatedAt?: fst.Timestamp[];
  cityV1Ref?: fst.DocumentReference<City>;
};

export type L2D1 = {
  type: "L2D1";
};
export type L2D2 = {
  type: "L2D2";
};

export type Empty = Record<string, never>;

export type Extends<A, E> = A extends E ? true : false;
type Not<B extends boolean> = B extends true ? false : true;
export type NotExtends<A, E> = Not<Extends<A, E>>;
export type Exact<A, B> = [A] extends [B]
  ? [B] extends [A]
    ? true
    : false
  : false;
export type Match<E, A extends E> = Exact<E, Pick<A, keyof E>>;
export type Never<T> = Exact<T, never>;

export type Assert<T extends true> = T;

export const doc = fst.doc as Doc<MySchema>;
export const collection = fst.collection as Collection<MySchema>;
export const query = fst.query as Query<MySchema>;

afterAll(async () => {
  await fst.terminate(DB);
});

test(`Defined<{a?: string}, "a"> is {a: string}`, () => {
  type T = Defined<{ a?: string }, "a">;
  type _ = Assert<Exact<{ a: string }, T>>;
});

describe(`Schema`, () => {
  test(`MySchema extends Schema`, () => {
    type _ = Assert<Extends<MySchema, Schema>>;
  });

  test(`interface doesn't extend Schema`, () => {
    interface A {
      a: number;
    }
    type S = {
      colName: {
        [Dockey: string]: { doc: A };
      };
    };
    type _ = Assert<NotExtends<S, Schema>>;
  });

  test(`comprehensive interface extends Schema`, () => {
    interface A {
      a: number;
      [K: string]: number | never;
    }
    type S = {
      colName: {
        [Dockey: string]: { doc: A };
      };
    };
    type _ = Assert<Extends<S, Schema>>;
  });
});
