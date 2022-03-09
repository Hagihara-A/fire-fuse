process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";

import * as admin from "firebase-admin";
import * as fst from "firebase-admin/firestore";
import * as fuse from "./index.js";

const app = admin.initializeApp({ projectId: "abc" });
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

test("placeholder", () => {});
