import { CollectionReference } from "@google-cloud/firestore";

import { DocumentData, FuseQuery, Schema } from "./index.js";
import { FuseDocumentReference } from "./reference.js";
import { ExcUndef, StrKeyof } from "./utils.js";

export type CollectionPaths<S extends Schema> = StrKeyof<S> extends infer ColKey
  ? ColKey extends StrKeyof<S>
    ? StrKeyof<S[ColKey]> extends infer DocKey
      ? DocKey extends StrKeyof<S[ColKey]>
        ? ExcUndef<S[ColKey][DocKey]["col"]> extends infer SS
          ? SS extends Schema
            ? `${ColKey}` | `${ColKey}/${DocKey}/${CollectionPaths<SS>}`
            : `${ColKey}`
          : never
        : never
      : never
    : never
  : never;

type Base<T extends DocumentData> = FuseQuery<T> &
  Omit<CollectionReference<T>, "where" | "orderBy">;

export interface FuseCollectionReference<T extends DocumentData>
  extends Base<T> {
  doc(id?: string): FuseDocumentReference<T>;
}
