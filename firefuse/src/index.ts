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

export interface Schema {
  [CollectionKey: string]: {
    [DocuemntKey: string]: {
      doc: DocumentData;
      col?: Schema;
    };
  };
}

export * from "./collection.js";
export * from "./constraint/orderby.js";
export * from "./constraint/other.js";
export * from "./constraint/QueryConstraint.js";
export * from "./constraint/where.js";
export * from "./doc.js";
export * from "./GetData.js";
export * from "./query.js";
