import * as fst from "firebase/firestore";

export type FieldType =
  | string
  | number
  | boolean
  | null
  | fst.Timestamp
  | FieldType[]
  | DocumentData
  | fst.DocumentReference<DocumentData>;

export interface DocumentData {
  readonly [K: string]: FieldType;
}

export type StrKeyof<T> = keyof T & string;

export interface Schema {
  [CollectionKey: string]: {
    [DocuemntKey: string]: {
      doc: DocumentData;
      col?: Schema;
    };
  };
}

export type ExcUndef<T> = Exclude<T, undefined>;

export type Defined<T extends DocumentData, K extends StrKeyof<T>> = T & {
  [L in K]-?: ExcUndef<T[K]>;
};

export * from "./collection.js";
export * from "./doc.js";
export * from "./GetData.js";
export * from "./query.js";
export * from "./constraint/orderby.js";
export * from "./constraint/where.js";
export * from "./constraint/other.js";
export * from "./constraint/QueryConstraint.js";
