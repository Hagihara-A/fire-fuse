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
  [K: string]: FieldType;
}

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

export type DeepKeys<T extends DocumentData> = {
  [K in keyof T]: T[K] extends DocumentData
    ? [K, ...DeepKeys<T[K]>] | [K]
    : [K];
}[keyof T];

export type Join<T extends string[]> = T extends [infer H]
  ? `${H & string}`
  : T extends [infer H, ...infer Rest]
  ? Rest extends string[]
    ? `${H & string}.${Join<Rest> & string}`
    : never
  : never;

export type UpdateKeys<T extends DocumentData> = Join<
  DeepKeys<T> extends string[] ? DeepKeys<T> : never
>;

type UpdateData<
  T extends DocumentData,
  U extends UpdateKeys<T> = UpdateKeys<T>
> = {
  [K in U]?: K extends `${infer H}.${infer Rest}`
    ? T[H] extends DocumentData
      ? Rest extends UpdateKeys<T[H]>
        ? UpdateData<T[H], Rest>[Rest]
        : never
      : never
    : K extends keyof T
    ? T[K] | firestore.FieldValue
    : never;
};

export type DeepPartial<T extends DocumentData> = {
  [K in keyof T]?: T[K] extends DocumentData ? DeepPartial<T[K]> : T[K];
};

const updateDoc = <T extends DocumentData>(
  doc: firestore.DocumentReference<T>,
  data: UpdateData<T> | DeepPartial<T>
) => firestore.updateDoc(doc, data as any);

export type ArrayOp = Extract<
  firestore.WhereFilterOp,
  "array-contains" | "array-contains-any"
>;

export type PrimitiveOp = Extract<
  firestore.WhereFilterOp,
  "<" | "<=" | "==" | "!=" | ">=" | ">" | "in" | "not-in"
>;

export const where = <T extends DocumentData>() => {
  return <
    F extends string & keyof T,
    V extends OP extends "array-contains-any"
      ? T[F] extends any[]
        ? T[F]
        : never
      : OP extends "in" | "not-in"
      ? T[F][]
      : OP extends "array-contains"
      ? T[F] extends (infer A)[]
        ? A
        : never
      : T[F],
    OP extends T[F] extends any[] ? ArrayOp : PrimitiveOp
  >(
    field: F,
    op: OP,
    value: V
  ) => firestore.where(field, op, value) as WhereConstraint<F, OP>;
};

export type KeyofPrimitive<
  T extends DocumentData,
  K extends keyof T = keyof T
> = {
  [L in K]: T[L] extends any[] | DocumentData ? never : L;
}[K];
export const orderBy = <T extends DocumentData>() => {
  return <F extends KeyofPrimitive<T> & string>(
    field: F,
    order?: firestore.OrderByDirection
  ) => firestore.orderBy(field, order) as OrderByConstraint<F>;
};

export interface WhereConstraint<
  F extends string,
  OP extends firestore.WhereFilterOp
> extends firestore.QueryConstraint {
  readonly type: Extract<firestore.QueryConstraintType, "where">;
  field: F;
  op: OP;
}

export interface OrderByConstraint<F extends string>
  extends firestore.QueryConstraint {
  readonly type: Extract<firestore.QueryConstraintType, "orderBy">;
  field: F;
}

export interface OtherConstraints extends firestore.QueryConstraint {
  readonly type: Exclude<firestore.QueryConstraintType, "where" | "orderBy">;
}

type CompareOp = Extract<firestore.WhereFilterOp, "<" | "<=" | ">" | ">=">;
type NotOp = Extract<firestore.WhereFilterOp, "not-in" | "!=">;

type Repeat<T> = [] | [T] | [T, T] | [T, T, T];

export type AllowedConstraints<T extends DocumentData> = {
  [K in string & keyof T]: readonly [
    ...([] | [WhereConstraint<K, NotOp>]),
    ...(
      | []
      | [WhereConstraint<K, "array-contains">]
      | [WhereConstraint<K, "array-contains-any">]
      | [WhereConstraint<K, "in">]
    ),
    ...Repeat<WhereConstraint<K, CompareOp>>,
    ...Repeat<WhereConstraint<string & keyof T, "==">>,
    ...Repeat<OrderByConstraint<K>>,
    ...OtherConstraints[]
  ];
}[string & keyof T];

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
