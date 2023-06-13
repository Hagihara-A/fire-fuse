import * as fst from "firebase/firestore";

import { DocumentData, FieldType } from "../index.js";
import { ExcUndef, StrKeyof } from "../utils.js";

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

export type ArrayOp = Extract<
  fst.WhereFilterOp,
  "array-contains" | "array-contains-any"
>;

export interface WhereConstraint<
  T extends DocumentData,
  F extends StrKeyof<T>,
  OP extends LegalOperation<T, F>,
  V extends Readonly<LegalValue<T, F, OP>>
> extends fst.QueryConstraint {
  readonly type: Extract<fst.QueryConstraintType, "where">;
  _field: F;
  _op: OP;
  _value: V;
}

export type EqualOp = Extract<fst.WhereFilterOp, "in" | "not-in" | "==" | "!=">;

export type GreaterOrLesserOp = Extract<
  fst.WhereFilterOp,
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
    ? V extends UnOrderable
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
  | (ExcUndef<T[F]> extends infer D
      ? D extends FieldType[]
        ? ArrayOp
        : D extends UnOrderable
        ? never
        : D extends Orderable
        ? GreaterOrLesserOp
        : never
      : never)
  | EqualOp;

export type Orderable = Exclude<FieldType, UnOrderable>;

export type UnOrderable =
  | DocumentData
  | FieldType[]
  | fst.DocumentReference<DocumentData>;
