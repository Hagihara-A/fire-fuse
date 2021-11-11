# firefuse. Definitely typed utilities for firestore

## What can I do with this package?

This is the typescript-first utility package for `firestore`.

`firefuse` provides

1. Zero-bundle package.
2. Fully compatible API with `firebase`. You don't have to learn anything other than original one.
3. Type-safe path.
4. Automatically typed `doc()` and `collection()` inferred by the path you sepcified.
5. Type-safe `where()`. For example, prohibiting querying with `string` whose type is actually `number`, removing undefined from specified property, narrowing union type using `==, in, not-in` ... and more!
6. Type-safe `query()`. For example, you CANNOT filter two or more fields, order unfilterd field ... and many more. `firefuse` detects all illegal constraints.

## Getting started

### install

```sh
npm i firefuse firebase@9
```

### Define Your schema

`Schema` is just plain Typescript's type. Interface is following.

```ts
interface SchemaBase {
  readonly [K: string]: {
    doc: DocumentData;
    subcollection?: SchemaBase;
  };
}
```

`K` is name of each collections. if `K` is `"user"|"posts"`, `user/{uid}` and `posts/{id}` are constructed.

Sample schema is following.

```ts
type Schema = {
  user: {
    doc: User;
    subcollection: {
      payment: {
        doc: Payment;
        subcollection: {
          paymentLog: {
            doc: PaymentLog;
          };
        };
      };
    };
  };
};
type User = {
  name: { first: string; last: number; middle?: string };
  age?: number;
  sex?: "male" | "female" | "other";
  birthDay: Timestamp;
  skills?: string[];
  isStudent: boolean;
};

type Payment = {
  company: string;
  cardNumber: number;
  expire: Timestamp;
};

type PaymentLog = {
  settledAt: Timestamp;
  amount: number;
};
```

NOTE: you can't use `Date` in your schema because firestore convert `Date` into `Timestamp` automatically. And `DocumentReference` is not supported currently.

### initialize app

```ts
const DB = firestore.getFirestore();
const collection = firestore.collection as fuse.Collection<Schema>;
const doc = firestore.doc as fuse.Doc<Schema>;
```

### Get reference

When you pass a wrong path, `firefuse` throws error.
You can see `user` is OK, while `users` is wrong.

```ts
collection(DB, "user"); // ✅
collection(DB, "users"); // ❌: Type '"users"' is not assignable to type '"user"'
collection(DB, "user", "uid", "payment", "pid", "paymentLog"); // ✅
collection(DB, "user", "uid", "payment", "pid", "paymentsLog"); // ❌: Type '"paymentsLog"' is not assignable to type '"paymentLog"'

doc(DB, "user", "uid"); // ✅
doc(DB, "users", "uid"); // ❌: Type '"users"' is not assignable to type '"user"'
doc(DB, "user", "uid", "payment", "pid", "paymentsLog", "logid"); // ❌: Type '"paymentsLog"' is not assignable to type '"paymentLog"'
```

### Construct query

First, cast your constraints using `firefuse`.

```ts
const { query } = fuse;
const where = firestore.where as fuse.Where<User>;
const orderBy = firestore.orderBy as fuse.OrderBy<User>;
const { limit, limitToLast, startAt, startAfter, endAt, endBefore } = fuse;
```

NOTE: `where` and `orderBy` are per-document because it depends the document type they constrain. It means you have to create with each single ducment-type. `query` and other constraints `limit, startAt etc...` is type agnostic. You can use them in any place.

`firefuse.query` is type-safe. For example you CANNOT specify `array-contains-any` in not-array field, CANNOT specify `<, <=, >=, >` in not-primitive field.

And more, `firefuse` detects all illegal constraints. Details [here](https://firebase.google.com/docs/firestore/query-data/queries#query_limitations).

You cannot query with `string` on `number` field and cannot operate `array-contains` on non-array field.

```ts
const userCol = collection(DB, "user");
where("age", "==", 22); // ✅
where("age", "==", "22"); // ❌: Argument of type 'string' is not assignable to parameter of type 'number'.
where("skills", "array-contains", "c"); // ✅
where("skills", "array-contains", ["c", "java"]); // ❌:Argument of type 'string[]' is not assignable to parameter of type 'string'.
```

`orderBy` is restricted only to apply in primitive field. It's not impossible, but hard to predict the result. If you REALLY want it, use original one.

```ts
orderBy("age"); // ✅
orderBy("skills"); // ❌: Argument of type '"skills"' is not assignable to parameter of type '"age" | "sex" | "birthDay" | "isStudent"'
```

`query` detects illegal constraints and convert type depending on your constraints. This is the most fancy feature.

```ts
const q1 = query(userCol, where("age", ">", 22), where("age", "<", 30)); // ✅: queried docs are typed to have `.age` property
firestore.getDocs(q1).then((qs) => qs.docs.map((doc) => doc.data().age)); // `.age` became required property!! You don't have to do undefined check.

const q2 = query(userCol, where("age", ">", 22), where("sex", "<", "male")); // ❌: filter on multiple field (firestore's limitation).
firestore.getDocs(q2).then((qs) => qs.docs.map((doc) => doc.data().age)); // doc.data() is never

const q3 = query(
  userCol,
  where("age", ">", 22),
  where("sex", "not-in", ["male"])
); // ❌: "<", "<=", ">=", ">", "!=" and not-in must filter the same field (firestore's limitation).
firestore.getDocs(q3).then((qs) => qs.docs.map((doc) => doc.data().age)); // doc.data() is never

const q4 = query(userCol, where("sex", "!=", "male" as const)); // ✅: note `as const`
firestore.getDocs(q4).then((qs) => qs.docs.map((doc) => doc.data().sex)); // now, sex is `"female" | "other"` because you removed it !!

const q5 = query(userCol, where("age", "==", 30 as const)); // ✅: note `as const`
firestore.getDocs(q5).then((qs) => qs.docs.map((doc) => doc.data().age === 30)); // now age === 30, becase you queried!!

query(
  userCol,
  where("sex", "in", ["female", "male"]),
  where("age", "not-in", [22, 23]),
  where("skills", "array-contains-any", ["c", "java"])
); // ❌:  in, not-in or array-contains-any must not be used at the same time and appear only once (firestore's limitation).

query(userCol, where("age", "<", 22), orderBy("age"), orderBy("birthDay")); // ✅
query(userCol, where("age", ">", 23), orderBy("birthDay")); //❌: if you include a filter with a range comparison (<, <=, >, >=), your first ordering must be on the same field: (firestore's limitation)
```

## What does this package differ from other package?

There are a lot of firestore manipulating packages. But most of them use exclusive implementation e.g. their own class or imcompatible interface which means you CAN NOT use with other packages easily even if it doesn't provide enough utilities. But when it comes to `firefuse`, it can't happen. Because `firefuse` is a set of utility types, which return original firestore objects such as `DocumentRefence`, `CollectionRefence`, `orderBy`, `where`. In other words, `firefuse` is fully compatible with `firestore`. If `firefuse` doesn't provide enough features, you can go back to `firestore` at any time.

You can use `firefuse` and `react-firebase-hooks` at the same time (if `react-firebase-hooks` supports v9).

## Complete Demo

[here](https://github.com/Hagihara-A/fire-fuse/blob/master/firefuse/demo.ts)
