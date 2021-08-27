import * as firestore from "firebase/firestore";

type User = {
  name: string;
  age: number;
};

type SchemaBase = {
  [K in string]: {
    doc: firestore.DocumentData;
    subcollection?: SchemaBase;
  };
};
type Collection<
  T extends firestore.DocumentData,
  SC extends SchemaBase | undefined = undefined
> = {
  doc: T;
  subcollection: SC;
};
type Payment = {
  cardNumber: number;
};
type Room = {
  size: number;
};
type MySchema = {
  user: Collection<User, { payment: Collection<Payment> }>;
  room: Collection<Room>;
  C1: Collection<
    { c1: "c1" },
    { C2: Collection<{ c2: "c2" }, { C3: Collection<{ c3: "c3" }> }> }
  >;
};

type CollectionPaths<S extends SchemaBase> = {
  [K in string & keyof S]: S[K]["subcollection"] extends SchemaBase
    ? [K] | [K, string, ...CollectionPaths<S[K]["subcollection"]>]
    : [K];
}[string & keyof S];

type DocumentPaths<S extends SchemaBase> = [...CollectionPaths<S>, string];
type Join<T extends string[]> = T extends [infer First, ...infer Rest]
  ? Rest extends string[]
    ? `/${First & string}${Join<Rest>}`
    : never
  : "";
type GetCollectionData<
  S extends SchemaBase,
  P extends CollectionPaths<S>
> = P extends [infer C]
  ? S[C & string]["doc"]
  : P extends [infer C, string, ...infer Rest]
  ? S[C & string]["subcollection"] extends SchemaBase
    ? Rest extends CollectionPaths<S[C & string]["subcollection"]>
      ? GetCollectionData<S[C & string]["subcollection"], Rest>
      : never
    : never
  : never;
type GetDocumentData<
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
    firestore.collection(DB, ...paths) as GetCollectionData<S, P>;
const col = collection<MySchema>();
const pay = col(firestore.getFirestore(), "user", "", "payment");
// export const fireFuse = <S extends SchemaBase>(DB: firestore.Firestore) => {
//   const collection = <P extends CollectionPaths<S>>(...paths: P) =>
//     firestore.collection(DB, paths.join("/")) as firestore.CollectionReference<
//       GetCollectionData<S, P>
//     >;
//   const doc = <P extends DocumentPaths<S>>(...paths: P) =>
//     firestore.doc(DB, paths.join("/")) as firestore.DocumentReference<
//       GetDocumentData<S, P>
//     >;
//   return { collection, doc };
// };

// const collection = <S extends SchemaBase>(
//   db: firestore.Firestore,
//   ...paths: CollectionPaths<S>
// ) =>
//   firestore.collection(db, ...paths) as firestore.CollectionReference<
//     GetCollectionData<S, typeof paths>
//   >;
// // const { collection, doc } = fireFuse<MySchema>(DB);
// const colRef = collection<MySchema>(DB, "user", "asdas", "payment");
// // const docRef = doc("C1", "asdasd", "C2", "asdas");
