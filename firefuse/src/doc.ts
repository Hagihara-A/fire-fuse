import * as fst from "firebase/firestore";

import { GetData } from "./GetData.js";
import { Schema, StrKeyof } from "./index.js";

export interface Doc<S extends Schema> {
  <T extends StringDocKeyData<S>>(
    collectionRef: fst.CollectionReference<T>
  ): fst.DocumentReference<T>;

  <T, P extends ChildDocPath<S, T>>(
    collectionRef: fst.CollectionReference<T>,
    id: P
  ): fst.DocumentReference<T>;

  <P extends DocumentPaths<S>>(
    firestore: fst.Firestore,
    ...paths: P
  ): fst.DocumentReference<GetData<S, P>>;
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

export type ChildDocPath<S extends Schema, T> = StrKeyof<S> extends infer ColKey
  ? ColKey extends keyof S
    ? StrKeyof<S[ColKey]> extends infer DocKey
      ? DocKey extends keyof S[ColKey]
        ? T extends S[ColKey][DocKey]["doc"]
          ? DocKey
          : S[ColKey][DocKey]["col"] extends Schema
          ? ChildDocPath<S[ColKey][DocKey]["col"], T>
          : never
        : never
      : never
    : never
  : never;

export type StringDocKeyData<S extends Schema> =
  StrKeyof<S> extends infer ColKey
    ? ColKey extends keyof S
      ? StrKeyof<S[ColKey]> extends infer DocKey
        ? DocKey extends keyof S[ColKey]
          ? S[ColKey][DocKey]["col"] extends Schema
            ? string extends DocKey
              ?
                  | S[ColKey][DocKey]["doc"]
                  | StringDocKeyData<S[ColKey][DocKey]["col"]>
              : StringDocKeyData<S[ColKey][DocKey]["col"]>
            : string extends DocKey
            ? S[ColKey][DocKey]["doc"]
            : never
          : never
        : never
      : never
    : never;
