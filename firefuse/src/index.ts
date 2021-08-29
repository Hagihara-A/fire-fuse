import * as firestore from "firebase/firestore";

type FieldType =
  | string
  | number
  | boolean
  | null
  | firestore.Timestamp
  | FieldType[]
  | DocumentData;

type DocumentData = {
  [K: string]: FieldType;
};

export type SchemaBase = {
  [K in string]: {
    doc: DocumentData;
    subcollection?: SchemaBase;
  };
};
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
  <P extends string[] & CollectionPaths<S>>(
    DB: firestore.Firestore,
    ...paths: P
  ) =>
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

export type UpdateData<
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
    ? T[K]
    : never;
};

export type DeepPartial<T extends DocumentData> = {
  [K in keyof T]?: T[K] extends DocumentData ? DeepPartial<T[K]> : T[K];
};

export const updateDoc = <T extends DocumentData>(
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
    V extends T[F] extends (infer A)[]
      ? OP extends "array-contains"
        ? A
        : T[F]
      : OP extends "in" | "not-in"
      ? T[F] extends any[]
        ? never
        : T[F][]
      : T[F],
    OP extends T[F] extends any[] ? ArrayOp : PrimitiveOp
  >(
    field: F,
    op: OP,
    value: V
  ) => firestore.where(field, op, value);
};
