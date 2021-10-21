import * as firestore from "firebase/firestore";
import { SchemaBase, GetData } from "./index.js";

export const collection =
  <S extends SchemaBase>() =>
  <P extends CollectionPaths<S>>(DB: firestore.Firestore, ...paths: P) =>
    firestore.collection(DB, paths.join("/")) as firestore.CollectionReference<
      GetData<S, P>
    >;

export type CollectionPaths<S extends SchemaBase> = {
  [K in keyof S]: S[K]["subcollection"] extends SchemaBase
    ? [K] | [K, string, ...CollectionPaths<S[K]["subcollection"]>]
    : [K];
}[keyof S];
