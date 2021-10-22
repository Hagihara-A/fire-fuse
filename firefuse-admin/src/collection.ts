import { SchemaBase, StrKeyof } from "./index.js";

export type CollectionPaths<S extends SchemaBase> = {
  [K in StrKeyof<S>]: S[K]["subcollection"] extends SchemaBase
    ? [K] | [K, string, ...CollectionPaths<S[K]["subcollection"]>]
    : [K];
}[StrKeyof<S>];
