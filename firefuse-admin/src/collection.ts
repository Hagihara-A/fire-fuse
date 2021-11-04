import { SchemaBase, StrKeyof } from "./index.js";

export type CollectionPaths<S extends SchemaBase> = StrKeyof<S> extends infer K
  ? K extends StrKeyof<S>
    ? S[K]["subcollection"] extends SchemaBase
      ? `${K}` | `${K}/${string}/${CollectionPaths<S[K]["subcollection"]>}`
      : `${K}`
    : never
  : never;
