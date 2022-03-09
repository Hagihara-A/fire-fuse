import { CollectionReference } from "@google-cloud/firestore";
import {
  DocumentData,
  FuseQuery,
  Schema,
  StrKeyof,
  ExcUndef,
} from "./index.js";
import { FuseDocumentReference } from "./reference.js";

export type CollectionPaths<S extends Schema> = StrKeyof<S> extends infer ColKey
  ? ColKey extends StrKeyof<S>
    ? StrKeyof<S[ColKey]> extends infer DocKey
      ? DocKey extends StrKeyof<S[ColKey]>
        ? S[ColKey][DocKey]["col"] extends Schema | undefined
          ?
              | `${ColKey}`
              | `${ColKey}/${DocKey}/${CollectionPaths<
                  ExcUndef<S[ColKey][DocKey]["col"]>
                >}`
          : `${ColKey}`
        : never
      : never
    : never
  : never;

type Base<T extends DocumentData> = FuseQuery<T> &
  Omit<CollectionReference<T>, "where">;
export interface FuseCollectionReference<T extends DocumentData>
  extends Base<T> {
  doc(id?: string): FuseDocumentReference<T>;
}
