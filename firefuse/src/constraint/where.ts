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
  _value: V;
}

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
  ? T[F]
  : OP extends "in" | "not-in"
  ? T[F][]
  : OP extends GreaterOrLesserOp
  ? T[F] extends UnPrimitive
    ? never
    : T[F]
  : OP extends "array-contains-any"
  ? T[F] extends (infer E)[]
    ? E[]
    : never
  : OP extends "array-contains"
  ? T[F] extends (infer E)[]
    ? E
    : never
  : never;

export type LegalOperation<T extends DocumentData, F extends StrKeyof<T>> =
  | (ExcUndef<T[F]> extends DocumentData
      ? never
      : ExcUndef<T[F]> extends FieldType[]
      ? ArrayOp
      : GreaterOrLesserOp)
  | CommonOp;
type UnPrimitive = DocumentData | FieldType[];
