import { Schema } from "./index.js";
import { ExcUndef, StrKeyof } from "./utils.js";

export type GetData<
  S extends Schema,
  P extends string
> = P extends `${infer ColKey}/${infer DocKey}/${infer Rest}`
  ? S[ColKey][DocKey]["col"] extends Schema | undefined
    ? Rest extends string
      ? GetData<ExcUndef<S[ColKey][DocKey]["col"]>, Rest>
      : never
    : never
  : P extends `${infer ColKey}/${infer DocKey}`
  ? S[ColKey][DocKey]["doc"]
  : S[P][StrKeyof<S[P]>]["doc"];
