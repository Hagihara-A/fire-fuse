import admin from "firebase-admin";
import { DocumentData, StrKeyof } from ".";
export interface FuseDocumentReference<T extends DocumentData>
  extends admin.firestore.DocumentReference<T> {
  update(
    data: UpdateData<T>,
    precondition?: admin.firestore.Precondition
  ): Promise<admin.firestore.WriteResult>;

  update(
    field: string | admin.firestore.FieldPath,
    value: unknown,
    ...moreFieldsOrPrecondition: unknown[]
  ): Promise<admin.firestore.WriteResult>;
}

export type UpdateData<T extends DocumentData, UP extends string= UpdatePaths<T>> = {
  [P in UP]?: UpdateValue<T, P>;
};

export type UpdatePaths<T extends DocumentData> = {
  [K in StrKeyof<T>]: T[K] extends DocumentData
    ? `${K}` | `${K}.${UpdatePaths<T[K]>}`
    : `${K}`;
}[StrKeyof<T>];

export type UpdateValue<
  T extends DocumentData,
  P extends UpdatePaths<T>
> = P extends `${infer Head}.${infer Rest}`
  ? T[Head] extends DocumentData
    ? Rest extends UpdatePaths<T[Head]>
      ? UpdateValue<T[Head], Rest>
      : never
    : never
  : P extends keyof T
  ? T[P]
  : never;
type P = UpdatePaths<{ a: { b: { c: number } }; d: string }>;
type V = UpdateValue<{ a: { b: { c: number } }; d: string }, "a">;
