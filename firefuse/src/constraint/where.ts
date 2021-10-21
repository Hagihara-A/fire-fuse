import * as firestore from "firebase/firestore";
import { DocumentData, StrKeyof, FieldType, ExcUndef } from "../index.js";

export const where = <T extends DocumentData>() => {
  return <
    F extends StrKeyof<T>,
    OP extends LegalOperation<T, F>,
    V extends Readonly<LegalValue<T, F, OP>>
  >(
    field: F,
    op: OP,
    value: V
  ) => firestore.where(field, op, value) as WhereConstraint<T, F, OP, V>;
};

export type ArrayOp = Extract<
  firestore.WhereFilterOp,
  "array-contains" | "array-contains-any"
>;

export interface WhereConstraint<
  T extends DocumentData,
  F extends StrKeyof<T>,
  OP extends LegalOperation<T, F>,
  V extends Readonly<LegalValue<T, F, OP>>
> extends firestore.QueryConstraint {
  readonly type: Extract<firestore.QueryConstraintType, "where">;
  _field: F;
  _op: OP;
  _value: ExcUndef<V>;
}

export type OR<T, U extends { [K in keyof T]?: unknown }> = {
  [K in keyof T]: K extends keyof U ? T[K] | U[K] : T[K];
};

export type OverWrite<
  T extends DocumentData,
  U extends { [K in keyof T]?: unknown }
> = {
  [K in keyof T]: K extends keyof U ? U[K] : T[K];
};

export type Defined<T extends DocumentData, K extends StrKeyof<T>> = T &
  { [L in K]-?: ExcUndef<T[K]> };
type CommonOp = Extract<firestore.WhereFilterOp, "in" | "not-in" | "==" | "!=">;

export type GreaterOrLesserOp = Extract<
  firestore.WhereFilterOp,
  "<" | "<=" | ">" | ">="
>;
export type LegalValue<
  T extends DocumentData,
  F extends StrKeyof<T>,
  OP extends LegalOperation<T, F>
> = OP extends "!=" | "=="
  ? ExcUndef<T[F]>
  : OP extends "in" | "not-in"
  ? ExcUndef<T[F]>[]
  : OP extends GreaterOrLesserOp
  ? ExcUndef<T[F]> extends UnPrimitive
    ? never
    : ExcUndef<T[F]>
  : OP extends "array-contains-any"
  ? ExcUndef<T[F]> extends (infer E)[]
    ? E[]
    : never
  : OP extends "array-contains"
  ? ExcUndef<T[F]> extends (infer E)[]
    ? E
    : never
  : never;

type LegalOperation<T extends DocumentData, F extends StrKeyof<T>> =
  | (T[F] extends DocumentData
      ? never
      : Exclude<T[F], undefined> extends FieldType[]
      ? ArrayOp
      : GreaterOrLesserOp)
  | CommonOp;
type UnPrimitive = DocumentData | FieldType[];

