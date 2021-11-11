import * as firestore from "firebase/firestore";
import { DocumentData, StrKeyof, FieldType, ExcUndef } from "../index.js";

export interface Where<T extends DocumentData> {
  <
    F extends StrKeyof<T>,
    OP extends LegalOperation<T, F>,
    V extends Readonly<LegalValue<T, F, OP>>
  >(
    field: F,
    op: OP,
    value: V
  ): WhereConstraint<T, F, OP, V>;
}

export const where = <T extends DocumentData>(): Where<T> => {
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
> = ExcUndef<T[F]> extends infer V
  ? OP extends "!=" | "=="
    ? V
    : OP extends "in" | "not-in"
    ? V[]
    : OP extends GreaterOrLesserOp
    ? V extends UnPrimitive
      ? never
      : V
    : OP extends "array-contains-any"
    ? V extends (infer E)[]
      ? E[]
      : never
    : OP extends "array-contains"
    ? V extends (infer E)[]
      ? E
      : never
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
