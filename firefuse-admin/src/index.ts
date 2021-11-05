import * as firestore from "firebase-admin/firestore";
import { CollectionPaths, FuseCollectionReference } from "./collection.js";
import { DocumentPaths } from "./doc.js";
import { FuseDocumentReference } from "./reference.js";

export type FieldType =
  | string
  | number
  | boolean
  | null
  | firestore.Timestamp
  | FieldType[]
  | DocumentData;

export interface DocumentData {
  readonly [K: string]: FieldType;
}

export type StrKeyof<T> = keyof T & string;

export interface SchemaBase {
  readonly [K: string]: {
    doc: DocumentData;
    subcollection?: SchemaBase;
  };
}
export type Collection<
  T extends DocumentData,
  SC extends SchemaBase | undefined = undefined
> = SC extends undefined
  ? { doc: T }
  : {
      doc: T;
      subcollection: SC;
    };

export type ExcUndef<T> = Exclude<T, undefined>;
export type OR<T, U extends { [K in keyof T]?: unknown }> = {
  [K in keyof T]: K extends keyof U ? T[K] | U[K] : T[K];
};

export type OverWrite<
  T extends DocumentData,
  U extends { [K in keyof T]?: unknown }
> = {
  [K in keyof T]: K extends keyof U ? U[K] : T[K];
};

export type Defined<T extends DocumentData, K extends StrKeyof<T>> = T &
  { [L in K]-?: ExcUndef<T[K]> };

// クエリかけたフィールドが存在する
// 不正なクエリならnever
export type Memory<T extends DocumentData> = {
  rangeField: StrKeyof<T>;
  eqField: StrKeyof<T>;
  prevNot: boolean;
  prevArrcon: boolean;
  prevOr: boolean;
  prevOrderBy: boolean;
};

export interface FuseFirestore<S extends SchemaBase>
  extends firestore.Firestore {
  doc<P extends DocumentPaths<S>>(
    documentPath: P
  ): FuseDocumentReference<GetData<S, P>>;

  collection<P extends CollectionPaths<S>>(
    collectionPath: P
  ): FuseCollectionReference<GetData<S, P>>;
}

export type Join<P extends string[], Sep extends string> = P extends [
  infer Head,
  ...infer Rest
]
  ? Head extends string
    ? Rest extends []
      ? Head
      : Rest extends string[]
      ? `${Head}${Sep}${Join<Rest, Sep>}`
      : never
    : never
  : never;

export type GetData<
  S extends SchemaBase,
  P extends CollectionPaths<S> | DocumentPaths<S>
> = P extends `${infer C}/${string}/${infer SC}`
  ? S[C]["subcollection"] extends SchemaBase
    ? SC extends
        | CollectionPaths<S[C]["subcollection"]>
        | DocumentPaths<S[C]["subcollection"]>
      ? GetData<S[C]["subcollection"], SC>
      : never
    : never
  : P extends `${infer C}/${string}`
  ? C extends keyof S
    ? S[C]["doc"]
    : never
  : P extends keyof S
  ? S[P]["doc"]
  : never;
export * from "./query/Query.js";
export * from "./query/where.js";
