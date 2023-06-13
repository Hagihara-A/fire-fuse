import { CollectionPaths, DocumentPaths, Schema } from "./index.js";

export type GetData<
  S extends Schema,
  P extends DocumentPaths<S> | CollectionPaths<S>
> = P extends [infer ColKey extends keyof S]
  ? S[ColKey][keyof S[ColKey]]["doc"]
  : P extends [infer ColKey extends keyof S, infer DocKey, ...infer Rest]
  ? DocKey extends keyof S[ColKey]
    ? Rest extends []
      ? S[ColKey][DocKey]["doc"]
      : S[ColKey][DocKey]["col"] extends infer SS extends Schema
      ? Rest extends DocumentPaths<SS> | CollectionPaths<SS>
        ? GetData<S[ColKey][DocKey]["col"], Rest>
        : never
      : never
    : never
  : never;
