import * as firestore from "firebase-admin/firestore";
import { DocumentData, StrKeyof } from ".";

export interface FuseDocumentReference<T extends DocumentData>
  extends firestore.DocumentReference<T> {
  update(
    data: UpdateData<T>,
    precondition?: firestore.Precondition
  ): Promise<firestore.WriteResult>;

  update(
    field: string | firestore.FieldPath,
    value: unknown,
    ...moreFieldsOrPrecondition: unknown[]
  ): Promise<firestore.WriteResult>;
}

export type UpdateData<T extends DocumentData> = {
  [P in UpdatePaths<T> as Join<P>]: UpdateValue<T, P>;
};

export type Join<P extends string[]> = P extends [infer Head, ...infer Rest]
  ? Head extends string
    ? Rest extends []
      ? Head
      : Rest extends [string, ...string[]]
      ? `${Head}.${Join<Rest>}`
      : never
    : never
  : never;
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
