import { CollectionReference } from "@google-cloud/firestore";
import { DocumentData, FuseQuery, SchemaBase, StrKeyof } from "./index.js";
import { FuseDocumentReference } from "./reference.js";
export type CollectionPaths<S extends SchemaBase> = StrKeyof<S> extends infer K
  ? K extends StrKeyof<S>
    ? S[K]["subcollection"] extends SchemaBase
      ? `${K}` | `${K}/${string}/${CollectionPaths<S[K]["subcollection"]>}`
      : `${K}`
    : never
  : never;

type Base<T extends DocumentData> = FuseQuery<T> & CollectionReference<T>;
export interface FuseCollectionReference<T extends DocumentData>
  extends Base<T> {
  doc(id?: string): FuseDocumentReference<T>;
}
