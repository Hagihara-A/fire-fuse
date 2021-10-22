import * as firestore from "firebase-admin/firestore";
import { DocumentData, Join, StrKeyof } from "./index.js";

export type UpdateData<T extends DocumentData> = {
  [P in UpdatePaths<T> as Join<P, ".">]: UpdateValue<T, P>;
};

export type UpdatePaths<T extends DocumentData> = {
  [K in StrKeyof<T>]: T[K] extends DocumentData
    ? [K] | [K, ...UpdatePaths<T[K]>]
    : [K];
}[StrKeyof<T>];

export type UpdateValue<
  T extends DocumentData,
  P extends UpdatePaths<T>
> = P extends [infer Head, ...infer Rest]
  ? Head extends keyof T
    ? T[Head] extends infer U
      ? Rest extends []
        ? U
        : U extends DocumentData
        ? Rest extends UpdatePaths<U>
          ? UpdateValue<U, Rest>
          : never
        : never
      : never
    : never
  : never;

export interface Update<T extends DocumentData> {
  (
    data: UpdateData<T>,
    precondition?: firestore.Precondition | undefined
  ): Promise<firestore.WriteResult>;
  (
    field: string | firestore.FieldPath,
    value: unknown,
    ...moreFieldsOrPrecondition: unknown[]
  ): Promise<firestore.WriteResult>;
}
