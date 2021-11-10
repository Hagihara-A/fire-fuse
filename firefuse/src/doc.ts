import * as firestore from "firebase/firestore";
import { SchemaBase, GetData, DocumentData } from "./index.js";
import { CollectionPaths } from "./collection.js";

export interface Doc<S extends SchemaBase> {
  <P extends DocumentPaths<S>>(
    DB: firestore.Firestore,
    ...paths: P
  ): firestore.DocumentReference<GetData<S, P>>;
  <T extends DocumentData>(
    collectionRef: firestore.CollectionReference<T>,
    ...id: [string] | []
  ): firestore.DocumentReference<T>;
}

export const doc = <S extends SchemaBase>(): Doc<S> => {
  // @ts-expect-error: Avoid infinite loop error. Deprecate in the future
  return <
    T extends DocumentData,
    P extends [string, string, ...string[]] & DocumentPaths<S>
  >(
    DBorRef: firestore.Firestore | firestore.CollectionReference<T>,
    ...paths: P | [string] | []
  ) => {
    if (DBorRef instanceof firestore.CollectionReference) {
      if (paths[0]) return firestore.doc(DBorRef, paths[0]);
      else return firestore.doc(DBorRef);
    } else {
      return firestore.doc(
        DBorRef,
        paths.join("/")
      ) as firestore.DocumentReference<GetData<S, P>>;
    }
  };
};

export type DocumentPaths<S extends SchemaBase> = [
  ...CollectionPaths<S>,
  string
];
