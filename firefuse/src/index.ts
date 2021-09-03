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
  [K: string]: {
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
    V extends ExcUndef<LegalValue<T, F, OP>>
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
  OP extends firestore.WhereFilterOp
> = OP extends "!=" | "=="
  ? ExcUndef<T[F]>
  : OP extends "in" | "not-in"
  ? ExcUndef<T[F]>[]
  : OP extends GreaterOrLesserOp
  ? T[F] extends UnPrimitive | undefined
    ? never
    : ExcUndef<T[F]>
  : OP extends "array-contains-any"
  ? T[F] extends FieldType[] | undefined
    ? T[F]
    : never
  : OP extends "array-contains"
  ? T[F] extends (infer E)[] | undefined
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
  V extends LegalValue<T, F, OP> | undefined
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

type Repeat<T> = [] | [T] | [T, T] | [T, T, T];

export type OrConstraints<
  T extends DocumentData,
  NotInKey extends StrKeyof<T>
> =
  | {
      [L in StrKeyof<T>]:
        | (T[L] extends DocumentData | undefined
            ? never
            : T[L] extends FieldType[] | undefined
            ? "array-contains-any" extends LegalOperation<T, L>
              ? T[L] extends LegalValue<T, L, "array-contains-any"> | undefined
                ? WhereConstraint<T, L, "array-contains-any", ExcUndef<T[L]>>
                : never
              : never
            : never)
        | WhereConstraint<T, L, "in", ExcUndef<T[L]>[]>;
    }[StrKeyof<T>]
  | WhereConstraint<T, NotInKey, "not-in", ExcUndef<T[NotInKey]>[]>;

export type AllowedConstraints<T extends DocumentData> = {
  [K in StrKeyof<T>]: readonly [
    ...Repeat<
      {
        [L in StrKeyof<T>]: WhereConstraint<T, L, "==", ExcUndef<T[L]>>;
      }[StrKeyof<T>]
    >,
    ...(GreaterOrLesserOp | "!=" extends LegalOperation<T, K>
      ? Repeat<WhereConstraint<T, K, GreaterOrLesserOp | "!=", T[K]>>
      : []),
    ...(
      | []
      | {
          [L in StrKeyof<T>]: "array-contains" extends LegalOperation<T, L>
            ? T[L] extends (infer E)[] | undefined
              ? E extends LegalValue<T, L, "array-contains">
                ? [WhereConstraint<T, L, "array-contains", E>]
                : []
              : []
            : [];
        }[StrKeyof<T>]
    ),
    ...([] | [OrConstraints<T, K>]),
    ...(
      | []
      | [OrderByConstraint<K>]
      | [OrderByConstraint<K>, OrderByConstraint<Exclude<StrKeyof<T>, K>>]
      | [
          OrderByConstraint<K>,
          OrderByConstraint<Exclude<StrKeyof<T>, K>>,
          OrderByConstraint<Exclude<StrKeyof<T>, K>>
        ]
    ),
    ...OtherConstraints[]
  ];
}[StrKeyof<T>];

export const query = <T extends DocumentData>(
  query: firestore.Query<T>,
  ...queryConstraints: AllowedConstraints<T>
) => firestore.query(query, ...queryConstraints);

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
