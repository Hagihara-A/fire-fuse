import * as firestore from "firebase/firestore";

export type FieldType =
  | string
  | number
  | boolean
  | null
  | firestore.Timestamp
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
  [K in keyof S]: S[K]["subcollection"] extends SchemaBase
    ? [K] | [K, string, ...CollectionPaths<S[K]["subcollection"]>]
    : [K];
}[keyof S];

export type DocumentPaths<S extends SchemaBase> = [
  ...CollectionPaths<S>,
  string
];

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

export const collection =
  <S extends SchemaBase>() =>
  <P extends CollectionPaths<S>>(DB: firestore.Firestore, ...paths: P) =>
    firestore.collection(DB, paths.join("/")) as firestore.CollectionReference<
      GetData<S, P>
    >;

export const doc = <S extends SchemaBase>() => {
  function d<P extends DocumentPaths<S>>(
    DB: firestore.Firestore,
    ...paths: P
  ): firestore.DocumentReference<GetData<S, P>>;

  function d<T extends DocumentData>(
    collectionRef: firestore.CollectionReference<T>,
    ...id: [string] | []
  ): firestore.DocumentReference<T>;

  function d<
    T extends DocumentData,
    P extends [string, string, ...string[]] & DocumentPaths<S>
  >(
    DBorRef: firestore.Firestore | firestore.CollectionReference<T>,
    ...paths: P | [string] | []
  ) {
    if (DBorRef instanceof firestore.CollectionReference) {
      if (typeof paths[0] === "undefined") {
        return firestore.doc(DBorRef);
      } else {
        return firestore.doc(DBorRef, paths[0]);
      }
    } else if (DBorRef instanceof firestore.Firestore) {
      return firestore.doc(
        DBorRef,
        paths.join("/")
      ) as firestore.DocumentReference<GetData<S, P>>;
    }
  }
  return d;
};

export type ArrayOp = Extract<
  firestore.WhereFilterOp,
  "array-contains" | "array-contains-any"
>;
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

export type KeyofPrimitive<
  T extends DocumentData,
  K extends keyof T = keyof T
> = {
  [L in K]: T[L] extends FieldType[] | DocumentData ? never : L;
}[K];
export const orderBy = <T extends DocumentData>() => {
  return <F extends KeyofPrimitive<T> & string>(
    field: F,
    order?: firestore.OrderByDirection
  ) => firestore.orderBy(field, order) as OrderByConstraint<F>;
};

type UnPrimitive = DocumentData | FieldType[];
type CommonOp = Extract<firestore.WhereFilterOp, "in" | "not-in" | "==" | "!=">;
type ExcUndef<T> = Exclude<T, undefined>;
type GreaterOrLesserOp = Extract<
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

export interface OrderByConstraint<F extends string>
  extends firestore.QueryConstraint {
  readonly type: Extract<firestore.QueryConstraintType, "orderBy">;
  field: F;
}

export interface OtherConstraints extends firestore.QueryConstraint {
  readonly type: Exclude<firestore.QueryConstraintType, "where" | "orderBy">;
}

export const query = <
  T extends DocumentData,
  CS extends readonly firestore.QueryConstraint[]
>(
  query: firestore.Query<T>,
  ...queryConstraints: CS
) => {
  return firestore.query(query, ...queryConstraints) as firestore.Query<
    ConstrainedData<T, CS>
  >;
};

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
};

export type ConstrainedData<
  T extends DocumentData,
  C extends readonly firestore.QueryConstraint[],
  Mem extends Memory<T> = {
    rangeField: StrKeyof<T>;
    eqField: never;
    prevNot: false;
    prevArrcon: false;
    prevOr: false;
  }
> = C extends []
  ? T
  : C extends readonly [infer H, ...infer Rest]
  ? Rest extends readonly firestore.QueryConstraint[]
    ? H extends WhereConstraint<infer U, infer K, infer OP, infer V>
      ? T extends U
        ? OP extends GreaterOrLesserOp
          ? K extends Mem["rangeField"]
            ? ConstrainedData<Defined<T, K>, Rest, Mem & { rangeField: K }>
            : never
          : OP extends "=="
          ? ConstrainedData<
              T & { [L in K]-?: V },
              Rest,
              OR<Mem, { eqField: K }>
            >
          : OP extends "!="
          ? Mem["prevNot"] extends true
            ? never
            : K extends Mem["rangeField"]
            ? ConstrainedData<
                T & { [L in K]-?: Exclude<T[L], V> },
                Rest,
                OverWrite<Mem, { prevNot: true }> & { rangeField: K }
              >
            : never
          : OP extends "array-contains"
          ? Mem["prevArrcon"] extends true
            ? never
            : ConstrainedData<
                Defined<T, K>,
                Rest,
                OverWrite<Mem, { prevArrcon: true }>
              >
          : OP extends "array-contains-any"
          ? Mem["prevArrcon"] extends true
            ? never
            : Mem["prevOr"] extends true
            ? never
            : ConstrainedData<
                Defined<T, K>,
                Rest,
                OverWrite<Mem, { prevArrcon: true; prevOr: true }>
              >
          : OP extends "in"
          ? Mem["prevOr"] extends true
            ? never
            : V extends readonly T[K][]
            ? ConstrainedData<
                T & { [L in K]-?: V[number] },
                Rest,
                OR<OverWrite<Mem, { prevOr: true }>, { eqField: K }>
              >
            : never
          : OP extends "not-in"
          ? Mem["prevOr"] extends true
            ? never
            : Mem["prevNot"] extends true
            ? never
            : V extends readonly T[K][]
            ? ConstrainedData<
                T & { [L in K]-?: Exclude<T[L], V[number] | undefined> },
                Rest,
                OverWrite<Mem, { prevOr: true; prevNot: true }>
              >
            : never
          : never
        : never
      : never
    : never
  : never;

export const limit = (limit: number) =>
  firestore.limit(limit) as OtherConstraints;
export const limitToLast = (limit: number) =>
  firestore.limitToLast(limit) as OtherConstraints;

export function startAt(
  snapshot: firestore.DocumentSnapshot<unknown>
): OtherConstraints;
export function startAt(...fieldValues: unknown[]): OtherConstraints;
export function startAt(
  ...fieldValues: [firestore.DocumentSnapshot<unknown>] | unknown[]
) {
  return firestore.startAt(...fieldValues) as OtherConstraints;
}

export function startAfter(
  snapshot: firestore.DocumentSnapshot<unknown>
): OtherConstraints;
export function startAfter(...fieldValues: unknown[]): OtherConstraints;
export function startAfter(
  ...fieldValues: unknown[] | [firestore.DocumentSnapshot<unknown>]
) {
  return firestore.startAfter(...fieldValues);
}

export function endAt(
  snapshot: firestore.DocumentSnapshot<unknown>
): OtherConstraints;
export function endAt(...fieldValues: unknown[]): OtherConstraints;
export function endAt(
  ...fieldValues: [firestore.DocumentSnapshot<unknown>] | unknown[]
) {
  return firestore.endAt(...fieldValues) as OtherConstraints;
}

export function endBefore(
  snapshot: firestore.DocumentSnapshot<unknown>
): OtherConstraints;
export function endBefore(...fieldValues: unknown[]): OtherConstraints;
export function endBefore(
  ...fieldValues: [firestore.DocumentSnapshot<unknown>] | unknown[]
) {
  return firestore.endBefore(...fieldValues) as OtherConstraints;
}
