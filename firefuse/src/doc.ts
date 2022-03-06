import * as firestore from "firebase/firestore";
import { GetData } from "./GetData.js";
import { DocumentData, Schema, StrKeyof } from "./index.js";

export interface Doc<S extends Schema> {
  <P extends DocumentPaths<S>>(
    DB: firestore.Firestore,
    ...paths: P
  ): firestore.DocumentReference<GetData<S, P>>;
  <T extends DocumentData>(
    collectionRef: firestore.CollectionReference<T>,
    id: string
  ): firestore.DocumentReference<T>;
}

export type DocumentPaths<S extends Schema> = StrKeyof<S> extends infer ColKey
  ? ColKey extends StrKeyof<S>
    ? StrKeyof<S[ColKey]> extends infer DocKey
      ? DocKey extends StrKeyof<S[ColKey]>
        ? S[ColKey][DocKey]["col"] extends Schema
          ?
              | [ColKey, DocKey]
              | [ColKey, DocKey, ...DocumentPaths<S[ColKey][DocKey]["col"]>]
          : [ColKey, DocKey]
        : never
      : never
    : never
  : never;
