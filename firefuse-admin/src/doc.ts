import { Schema } from "./index.js";
import { ExcUndef, StrKeyof } from "./utils.js";

export type DocumentPaths<S extends Schema> = StrKeyof<S> extends infer ColKey
  ? ColKey extends StrKeyof<S>
    ? StrKeyof<S[ColKey]> extends infer DocKey
      ? DocKey extends StrKeyof<S[ColKey]>
        ? ExcUndef<S[ColKey][DocKey]["col"]> extends infer SS
          ? SS extends Schema
            ? `${ColKey}/${DocKey}` | `${ColKey}/${DocKey}/${DocumentPaths<SS>}`
            : `${ColKey}/${DocKey}`
          : never
        : never
      : never
    : never
  : never;
