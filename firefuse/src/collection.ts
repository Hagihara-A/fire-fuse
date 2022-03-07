import * as fst from "firebase/firestore";
import { GetData } from "./GetData.js";
import { Schema, StrKeyof } from "./index.js";

export interface Collection<S extends Schema> {
  <P extends CollectionPaths<S>>(
    DB: fst.Firestore,
    ...paths: P
  ): fst.CollectionReference<GetData<S, P>>;
}

export type CollectionPaths<S extends Schema> = StrKeyof<S> extends infer ColKey
  ? ColKey extends StrKeyof<S>
    ? StrKeyof<S[ColKey]> extends infer DocKey
      ? DocKey extends StrKeyof<S[ColKey]>
        ? S[ColKey][DocKey]["col"] extends Schema
          ?
              | [ColKey]
              | [ColKey, DocKey, ...CollectionPaths<S[ColKey][DocKey]["col"]>]
          : [ColKey]
        : never
      : never
    : never
  : never;
