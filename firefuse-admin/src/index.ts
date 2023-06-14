import * as fst from "@google-cloud/firestore";

import { CollectionPaths, FuseCollectionReference } from "./collection.js";
import { DocumentPaths } from "./doc.js";
import { GetData } from "./GetData.js";
import { FuseDocumentReference } from "./reference.js";

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

// @ts-expect-error judged as too deep
export interface FuseFirestore<S extends Schema> extends fst.Firestore {
  doc<P extends DocumentPaths<S>>(
    documentPath: P
  ): FuseDocumentReference<GetData<S, P>>;

  collection<P extends CollectionPaths<S>>(
    collectionPath: P
  ): FuseCollectionReference<GetData<S, P>>;
}

export { CollectionPaths } from "./collection.js";
export { DocumentPaths } from "./doc.js";
export * from "./GetData.js";
export * from "./query/Query.js";
export * from "./query/where.js";
