# fire-fuse. Definitely typed utilities for firestore

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
npm i firefuse firebase
```

### define schema

First of all, define your schema that represents the Documet-relation. This is just a plain Typescript type, so you can reuse existing ones.

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

`firefuse.query` & `firefuse.orderBy` is type-safe. For example you cannot specify `array-contains-any` in not-array field, cannot specify `<, <=, >=, >` in not-primitive field.

And more, `firefuse` detects major illegal constraints(not all). Details [here](https://firebase.google.com/docs/firestore/query-data/queries#query_limitations).

```ts
const { query, limit, limitToLast, startAt, startAfter, endAt, endBefore } =
  "fuse";

query(userCol, where("age", ">", 22), where("age", "<", 30)); // ✅: filter on single field
query(userCol, where("age", ">", 22), where("sex", "<", "male")); // ❌: filter on multiple field (firestore's limitation).
query(userCol, where("age", ">", 22), where("sex", "not-in", ["male"])); // ❌: "<", "<=", ">=", ">" and not-in must filter same field (firestore's limitation).

query(
  userCol,
  where("sex", "in", ["female", "male"]),
  where("age", "not-in", [22, 23]),
  where("skills", "array-contains-any", ["c", "java"])
); // ❌:  in, not-in or array-contains-any must not be used at the same time and appear only once (firestore's limitation).

query(userCol, where("age", "<", 22), orderBy("age"), orderBy("birthDay")); // ✅
query(userCol, where("age", ">", 23), orderBy("birthDay")); //❌: first orderBy's field must be filtered field in where(firestore's limitation)
```

**Warning!**

Because of Typescript limitations, `firefuse.query` enforces you to order constraints showed in below table(see order).

And for performance reason, `firefuse` accepts simlar constraints at most 3 times. Details below.

| order in `fuse.query` |                                      operations                                       | At most |                                               detail                                                |
| --------------------: | :-----------------------------------------------------------------------------------: | :-----: | :-------------------------------------------------------------------------------------------------: |
|                     1 |                                          ==                                           |    3    |   when you specify `==` on a field, you cant `orderBy` with that field (`firefuse` don't detect)    |
|                     2 |                                   <, <=, >=, >, !=                                    |    3    |             you can't use `!=` and `not-in` at the same query (`firefuse` don't detect)             |
|                     3 |                                    array-contains                                     |    1    | you can't use `array-contains-any` and `array-contains` at the same query (`firefuse` don't detect) |
|                     4 |                        in <br/>not-in<br/> array-contains-any                         |    1    |                                     can't use at the same query                                     |
|                     5 |                                        orderBy                                        |    3    |            first `orderBy` must be given the field that is specified in previous `where`            |
|                     6 | limit <br />limitToLast <br />startAt <br /> startAfter <br /> endAt <br /> endBefore |    ∞    |                                               no rule                                               |

## What does this package differ from other package?

There are a lot of firestore manipulating packages. But most of them use exclusive implementation e.g. custom class, which means you CAN NOT use with other packages easily even if it doesn't provide enough utilities. But when it comes to `firefuse`, it couldn't happen. Because `firefuse` is a set of utility functions, which return original firestore objects such as `DocumentRefence`, `CollectionRefence`, `orderBy`, `where`. In other words, `firefuse` is fully compatible with `firestore`. If `firefuse` doesn't provide enough features, you can go back to `firestore` at any time.

You can use `firefuse` and `react-firebase-hooks` at the same time (if `react-firebase-hooks` supports v9).

## More Demos

```ts
import * as fuse from "firefuse";
import * as firestore from "firebase/firestore";

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

const DB = firestore.getFirestore();
const collection = fuse.collection<Schema>();
const doc = fuse.doc<Schema>();

collection(DB, "user"); // ✅
collection(DB, "users"); // ❌: Type '"users"' is not assignable to type '"user"'
collection(DB, "user", "uid", "payment", "pid", "paymentLog"); // ✅
collection(DB, "user", "uid", "payment", "pid", "paymentsLog"); // ❌: Type '"paymentsLog"' is not assignable to type '"paymentLog"'

doc(DB, "user", "uid"); // ✅
doc(DB, "users", "uid"); // ❌: Type '"users"' is not assignable to type '"user"'
doc(DB, "user", "uid", "payment", "pid", "paymentsLog", "logid"); // ❌: Type '"paymentsLog"' is not assignable to type '"paymentLog"'

const userCollection = collection(DB, "user"); // ✅
doc(userCollection); // ✅
doc(userCollection, "uid"); // ✅

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

query(userCol, where("age", ">", 22), where("age", "<", 30)); // ✅: filter on single field
query(userCol, where("age", ">", 22), where("sex", "<", "male")); // ❌: filter on multiple field (firestore's limitation).
query(userCol, where("age", ">", 22), where("sex", "not-in", ["male"])); // ❌: "<", "<=", ">=", ">" and not-in must filter same field (firestore's limitation).

query(
  userCol,
  where("sex", "in", ["female", "male"]),
  where("age", "not-in", [22, 23]),
  where("skills", "array-contains-any", ["c", "java"])
); // ❌:  in, not-in or array-contains-any must not be used at the same time and appear only once (firestore's limitation).

query(userCol, where("age", "<", 22), orderBy("age"), orderBy("birthDay")); // ✅
query(userCol, where("age", ">", 23), orderBy("birthDay")); //❌: first orderBy's field must be filtered field in where(firestore's limitation)

// use other constraints
const { limit, limitToLast, startAt, startAfter, endAt, endBefore } = fuse;

const { query, limit, limitToLast, startAt, startAfter, endAt, endBefore } =
  fuse;
```
