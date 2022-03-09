import { Precondition, WriteResult, FieldPath } from "@google-cloud/firestore";
import { DocumentData, ExcUndef, StrKeyof } from "./index.js";

export type UpdateData<T extends DocumentData> = {
  [P in UpdatePaths<T>]?: UpdateValue<T, P>;
};

export type UpdatePaths<T extends DocumentData> = StrKeyof<T> extends infer K
  ? K extends StrKeyof<T>
    ? ExcUndef<T[K]> extends DocumentData
      ? // @ts-expect-error judged as too deep
        `${K}` | `${K}.${UpdatePaths<ExcUndef<T[K]>>}`
      : `${K}`
    : never
  : never;

export type UpdateValue<
  T extends DocumentData,
  P extends UpdatePaths<T>
> = P extends `${infer K}.${infer L}`
  ? K extends keyof T
    ? T[K] extends infer U
      ? U extends DocumentData
        ? L extends UpdatePaths<U>
          ? UpdateValue<U, L>
          : never
        : never
      : never
    : never
  : P extends keyof T
  ? ExcUndef<T[P]>
  : never;

export interface Update<T extends DocumentData> {
  (
    data: UpdateData<T>,
    precondition?: Precondition | undefined
  ): Promise<WriteResult>;
  (
    field: string | FieldPath,
    value: unknown,
    ...moreFieldsOrPrecondition: unknown[]
  ): Promise<WriteResult>;
}
