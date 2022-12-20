import { ExcUndef, Schema, StrKeyof } from "./index.js";

export type DocumentPaths<S extends Schema> = StrKeyof<S> extends infer ColKey
  ? ColKey extends StrKeyof<S>
    ? StrKeyof<S[ColKey]> extends infer DocKey
      ? DocKey extends StrKeyof<S[ColKey]>
        ? S[ColKey][DocKey]["col"] extends Schema | undefined
          ?
              | `${ColKey}/${DocKey}`
              | `${ColKey}/${DocKey}/${DocumentPaths<
                  ExcUndef<S[ColKey][DocKey]["col"]>
                >}`
          : `${ColKey}/${DocKey}`
        : never
      : never
    : never
  : never;
