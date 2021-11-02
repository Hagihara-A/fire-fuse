
import * as admin from "firebase-admin";
import { DocumentData, StrKeyof, ExcUndef, FieldType } from "..";

type WhereFilterOp = FirebaseFirestore.WhereFilterOp;

export type ArrayOp = Extract<
  WhereFilterOp,
  "array-contains" | "array-contains-any"
>;

export interface WhereConstraint<
  T extends DocumentData,
  F extends StrKeyof<T>,
  OP extends LegalOperation<T, F>,
  V extends Readonly<LegalValue<T, F, OP>>
> extends admin.firestore.QueryConstraint {
  readonly type: Extract<FirebaseFirestore.QueryConstraintType, "where">;
  _field: F;
  _op: OP;
  _value: V;
}

type CommonOp = Extract<FirebaseFirestore.WhereFilterOp, "in" | "not-in" | "==" | "!=">;

export type GreaterOrLesserOp = Extract<
  FirebaseFirestore.WhereFilterOp,
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