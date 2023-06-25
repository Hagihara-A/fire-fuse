process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";

import * as admin from "firebase-admin";
import * as fst from "firebase-admin/firestore";

import * as fuse from "./index.js";

const app = admin.initializeApp({ projectId: "abc" });

//@ts-expect-error too deep
export const DB = admin.firestore(app) as fuse.FuseFirestore<MySchema>;

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
export type Never<T> = Exact<T, never>;

export type Assert<T extends true> = T;

describe(`Schema`, () => {
  test(`MySchema extends Schema`, () => {
    type _ = Assert<Extends<MySchema, fuse.Schema>>;
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
    type _ = Assert<NotExtends<S, fuse.Schema>>;
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
    type _ = Assert<Extends<S, fuse.Schema>>;
  });
});
