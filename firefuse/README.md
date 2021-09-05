# firefuse. Definitely typed utilities for firestore

## What can I do with this package?

This is the typescript-first utility package for firestore-v9.

```ts
// assume we defined schema beforehand
// such as  /user/{uid}/payment/{payId}/paymentLog/{logId}
const DB = firestore.getFirestore();

collection(DB, "user"); // ✅
collection(DB, "users"); // ❌: Type '"users"' is not assignable to type '"user"'
collection(DB, "user", "uid", "payment", "pid", "paymentLog"); // ✅
collection(DB, "user", "uid", "payment", "pid", "paymentsLog"); // ❌: Type '"paymentsLog"' is not assignable to type '"paymentLog"'

doc(DB, "user", "uid"); // ✅
doc(DB, "users", "uid"); // ❌: Type '"users"' is not assignable to type '"user"'
doc(DB, "user", "uid", "payment", "pid", "paymentsLog", "logid"); // ❌: Type '"paymentsLog"' is not assignable to type '"paymentLog"'

query(userCol, where("age", ">", 22), where("age", "<", 30)); // ✅: filter on single field
query(userCol, where("age", ">", 22), where("sex", "<", "male")); // ❌: filter on multiple field (firestore's limitation).
```

This package enable you to specify firestore's path completely type safely.

And query detect illegal composition of constraints such as `where`, `orderBy` like showed in above example.

## How to use

### install

```sh
npm i firefuse firebase@9
```

### define schema

First of all, define your schema that represents the Document-Relation. This is just a plain Typescript type, so you can reuse existing ones.

In the above example, I defined following schema.

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
  age: number;
  sex: "male" | "female" | "other";
  birthDay: firestore.Timestamp;
  skills: string[];
  isStudent: boolean;
};

type Payment = {
  company: string;
  cardNumber: number;
  expire: firestore.Timestamp;
};

type PaymentLog = {
  settledAt: firestore.Timestamp;
  amount: number;
};
```

Altough this is a little bit long, not complex at all.

Then, construct utilities providing your schema.

```ts
import * as fuse from "firefuse";
const collection = fuse.collection<Schema>();
const doc = fuse.doc<Schema>();

const where = fuse.where<User>();
const orderBy = fuse.orderBy<User>();

// no schema required
const { query, limit, limitToLast, startAt, startAfter, endAt, endBefore } =
  fuse;
```

That's all! No more configuration is necessary!

### get reference

```ts
collection(DB, "user"); // ✅
collection(DB, "users"); // ❌: Type '"users"' is not assignable to type '"user"'
doc(DB, "user", "uid"); // ✅
doc(DB, "users", "uid"); // ❌: Type '"users"' is not assignable to type '"user"'

const userCollection = collection(DB, "user"); // ✅
doc(userCollection); // ✅
doc(userCollection, "uid"); // ✅
```

### construct query

`firefuse.query` is type-safe. For example you CANNOT specify `array-contains-any` in not-array field, CANNOT specify `<, <=, >=, >` in not-primitive field.

And more, `firefuse` detects all illegal constraints. Details [here](https://firebase.google.com/docs/firestore/query-data/queries#query_limitations).

```ts
const userCol = collection(DB, "user");
const { query } = fuse;
const where = fuse.where<User>();
const orderBy = fuse.orderBy<User>();
where("age", "==", 22); // ✅
where("age", "==", "22"); // ❌: Argument of type 'string' is not assignable to parameter of type 'number'.
where("skills", "array-contains", "c"); // ✅
where("skills", "array-contains", ["c", "java"]); // ❌:Argument of type 'string[]' is not assignable to parameter of type 'string'.

orderBy("age"); // ✅
orderBy("skills"); // ❌: Argument of type '"skills"' is not assignable to parameter of type '"age" | "sex" | "birthDay" | "isStudent"'

const q1 = query(userCol, where("age", ">", 22), where("age", "<", 30)); // ✅: queried docs are typed to have `.age` property
firestore.getDocs(q1).then((qs) => qs.docs.map((doc) => doc.data().age)); // `.age` became required property!!

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

There are a lot of firestore manipulating packages. But most of them use exclusive implementation e.g. custom class or new interface which means you CAN NOT use with other packages easily even if it doesn't provide enough utilities. But when it comes to `firefuse`, it couldn't happen. Because `firefuse` is a set of utility functions, which return original firestore objects such as `DocumentRefence`, `CollectionRefence`, `orderBy`, `where`. In other words, `firefuse` is fully compatible with `firestore`. If `firefuse` doesn't provide enough features, you can go back to `firestore` at any time.

You can use `firefuse` and `react-firebase-hooks` at the same time (if `react-firebase-hooks` supports v9).

## Complete Demo

[here](https://github.com/Hagihara-A/fire-fuse/blob/master/firefuse/demo.ts)
