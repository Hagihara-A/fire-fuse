import * as fst from "@google-cloud/firestore";
import { CollectionPaths, FuseCollectionReference } from "./collection.js";
import { DocumentPaths } from "./doc.js";
import { FuseDocumentReference } from "./reference.js";
import { GetData } from "./GetData.js";

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

export type Defined<T extends DocumentData, K extends StrKeyof<T>> = T &
  { [L in K]-?: ExcUndef<T[K]> };

// @ts-expect-error judged as too deep
export interface FuseFirestore<S extends Schema> extends fst.Firestore {
  doc<P extends DocumentPaths<S>>(
    documentPath: P
  ): FuseDocumentReference<GetData<S, P>>;

  collection<P extends CollectionPaths<S>>(
    collectionPath: P
  ): FuseCollectionReference<GetData<S, P>>;
}

export * from "./query/Query.js";
export * from "./query/where.js";
export * from "./GetData.js";
