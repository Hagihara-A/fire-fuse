import * as firestore from "firebase/firestore";
import { CollectionPaths } from "./collection.js";
import { DocumentPaths } from "./doc.js";

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
// export type Collection<
//   T extends DocumentData,
//   SC extends SchemaBase | undefined = undefined
// > = SC extends undefined
//   ? { doc: T }
//   : {
//       doc: T;
//       subcollection: SC;
//     };

export type GetData<
  S extends SchemaBase,
  P extends CollectionPaths<S> | DocumentPaths<S>
> = P extends [infer C] | [infer C, string]
  ? S[C & string]["doc"]
  : P extends [infer C, string, ...infer Rest]
  ? S[C & string]["subcollection"] extends SchemaBase
    ? Rest extends
        | CollectionPaths<S[C & string]["subcollection"]>
        | DocumentPaths<S[C & string]["subcollection"]>
      ? GetData<S[C & string]["subcollection"], Rest>
      : never
    : never
  : never;

export type KeyofPrimitive<
  T extends DocumentData,
  K extends keyof T = keyof T
> = {
  [L in K]: T[L] extends FieldType[] | DocumentData ? never : L;
}[K];

export type ExcUndef<T> = Exclude<T, undefined>;

export type Defined<T extends DocumentData, K extends StrKeyof<T>> = T &
  { [L in K]-?: ExcUndef<T[K]> };

export type Merge<T extends DocumentData> = { [K in keyof T]: T[K] };

export * from "./doc.js";
export * from "./collection.js";
export * from "./query.js";
export * from "./constraint/orderby.js";
export * from "./constraint/where.js";
export * from "./constraint/other.js";
