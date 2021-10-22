import { SchemaBase } from "./index.js";
import { CollectionPaths } from "./collection.js";

export type DocumentPaths<S extends SchemaBase> = [
  ...CollectionPaths<S>,
  string
];
