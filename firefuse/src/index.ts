import * as firestore from "firebase/firestore";

export type SchemaBase = {
  [K in string]: {
    doc: firestore.DocumentData;
    subcollection?: SchemaBase;
  };
};
export type Collection<
  T extends firestore.DocumentData,
  SC extends SchemaBase | undefined = undefined
> = {
  doc: T;
  subcollection: SC;
};

export type CollectionPaths<S extends SchemaBase> = {
  [K in string & keyof S]: S[K]["subcollection"] extends SchemaBase
    ? [K] | [K, string, ...CollectionPaths<S[K]["subcollection"]>]
    : [K];
}[string & keyof S];

export type DocumentPaths<S extends SchemaBase> = [
  ...CollectionPaths<S>,
  string
];

export type GetCollectionData<
  S extends SchemaBase,
  P extends string[] & CollectionPaths<S>
> = P extends [infer C]
  ? S[C & string]["doc"]
  : P extends [infer C, string, ...infer Rest]
  ? S[C & string]["subcollection"] extends SchemaBase
    ? Rest extends string[] & CollectionPaths<S[C & string]["subcollection"]>
      ? GetCollectionData<S[C & string]["subcollection"], Rest>
      : never
    : never
  : never;

export type GetDocumentData<
  S extends SchemaBase,
  P extends DocumentPaths<S>
> = P extends [infer C, string]
  ? S[C & string]["doc"]
  : P extends [infer C, string, ...infer Rest]
  ? S[C & string]["subcollection"] extends SchemaBase
    ? Rest extends DocumentPaths<S[C & string]["subcollection"]>
      ? GetDocumentData<S[C & string]["subcollection"], Rest>
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
      GetCollectionData<S, P>
    >;
