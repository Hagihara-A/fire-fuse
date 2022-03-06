import { Schema, CollectionPaths, StrKeyof } from "./index.js";
import { DocumentPaths } from "./doc.js";

export type GetData<
  S extends Schema,
  P extends CollectionPaths<S> | DocumentPaths<S>
> = P extends [infer ColKey]
  ? ColKey extends StrKeyof<Schema>
    ? S[ColKey][string]["doc"]
    : never
  : P extends [infer ColKey, infer DocKey, ...infer Rest]
  ? ColKey extends StrKeyof<S>
    ? DocKey extends StrKeyof<S[ColKey]>
      ? Rest extends []
        ? S[ColKey][DocKey]["doc"]
        : S[ColKey][DocKey]["col"] extends Schema
        ? Rest extends
            | CollectionPaths<S[ColKey][DocKey]["col"]>
            | DocumentPaths<S[ColKey][DocKey]["col"]>
          ? GetData<S[ColKey][DocKey]["col"], Rest>
          : never
        : never
      : never
    : never
  : never;
