import {
  DocumentData,
  StrKeyof,
  ExcUndef,
  FieldType,
  Defined,
} from "../index.js";

export type WhereData<
  T extends DocumentData,
  F extends StrKeyof<T>,
  OP extends LegalOperation<T, F>,
  V extends LegalValue<T, F, OP>
> = OP extends GreaterOrLesserOp
  ? Defined<T, F>
  : OP extends "=="
  ? T & { [K in F]-?: V }
  : OP extends "!="
  ? T & { [K in F]-?: Exclude<T[K], V | undefined> }
  : OP extends "in"
  ? V extends readonly (infer E)[]
    ? T & { [K in F]: E }
    : never
  : OP extends "not-in"
  ? T &
      {
        [K in F]-?: Exclude<
          T[K],
          (V extends readonly (infer E)[] ? E : never) | undefined
        >;
      }
  : OP extends "array-contains"
  ? Defined<T, F>
  : OP extends "array-contains-any"
  ? Defined<T, F>
  : never;

type WhereFilterOp = FirebaseFirestore.WhereFilterOp;

export type ArrayOp = Extract<
  WhereFilterOp,
  "array-contains" | "array-contains-any"
>;

type CommonOp = Extract<
  FirebaseFirestore.WhereFilterOp,
  "in" | "not-in" | "==" | "!="
>;

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
    ? readonly V[]
    : OP extends GreaterOrLesserOp
    ? V extends UnPrimitive
      ? never
      : V
    : OP extends "array-contains-any"
    ? V extends (infer E)[]
      ? readonly E[]
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
