import admin from "firebase-admin";

export type FieldType =
  | string
  | number
  | boolean
  | null
  | admin.firestore.Timestamp
  | FieldType[]
  | DocumentData;

export interface DocumentData {
  readonly [K: string]: FieldType | undefined;
}

export type StrKeyof<T> = keyof T & string;

export interface SchemaBase {
  readonly [K: string]: {
    doc: DocumentData;
    subcollection?: SchemaBase;
  };
}
export type Collection<
  T extends DocumentData,
  SC extends SchemaBase | undefined = undefined
> = {
  doc: T;
  subcollection: SC;
};

export type CollectionPaths<S extends SchemaBase> = {
  [K in StrKeyof<S>]: S[K]["subcollection"] extends SchemaBase
    ? `${K}` | `${K}/${string}/${CollectionPaths<S[K]["subcollection"]>}`
    : `${K}`;
}[StrKeyof<S>];

export type DocumentPaths<S extends SchemaBase> =
  `${CollectionPaths<S>}/${string}`;

export type GetData<
  S extends SchemaBase,
  P extends CollectionPaths<S> | DocumentPaths<S>
> = P extends [infer C] | [infer C, string]
  ? S[C & string]["doc"]
  : P extends [infer C, string, ...infer Rest]
  ? S[C & string]["subcollection"] extends SchemaBase
    ? Rest extends
        | CollectionPaths<S[C & string]["subcollection"]>
        | DocumentPaths<S[C & string]["subcollection"]>
      ? GetData<S[C & string]["subcollection"], Rest>
      : never
    : never
  : never;

type WhereFilterOp = FirebaseFirestore.WhereFilterOp;

export type ArrayOp = Extract<
  WhereFilterOp,
  "array-contains" | "array-contains-any"
>;

export type KeyofPrimitive<
  T extends DocumentData,
  K extends keyof T = keyof T
> = {
  [L in K]: T[L] extends FieldType[] | DocumentData ? never : L;
}[K];

type UnPrimitive = DocumentData | FieldType[];
type CommonOp = Extract<WhereFilterOp, "in" | "not-in" | "==" | "!=">;
type ExcUndef<T> = Exclude<T, undefined>;
type GreaterOrLesserOp = Extract<WhereFilterOp, "<" | "<=" | ">" | ">=">;
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

// // クエリかけたフィールドが存在する
// // 不正なクエリならnever
export type Memory<T extends DocumentData> = {
  rangeField: StrKeyof<T>;
  eqField: StrKeyof<T>;
  prevNot: boolean;
  prevArrcon: boolean;
  prevOr: boolean;
  prevOrderBy: boolean;
};

export interface FuseFirestore<S extends SchemaBase>
  extends admin.firestore.Firestore {
  doc<P extends DocumentPaths<S>>(
    path: P extends infer A ? A : never
  ): admin.firestore.DocumentReference<DocumentData>;

  collection<P extends CollectionPaths<S>>(
    path: P extends infer A ? A : never
  ): admin.firestore.CollectionReference<DocumentData>;
}
export const asFuse = <T extends SchemaBase>(DB: admin.firestore.Firestore) =>
  DB as FuseFirestore<T>;
