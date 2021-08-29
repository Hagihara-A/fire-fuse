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
```

This package enable you to specify firestore's path completely type safely.
And more, type safe queries such as `where`, `orderBy` are provided.

## How to use

```sh
npm i firefuse firebase
```

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
```

That's all! No more configuration is necessary!

## What does this package differ from other package?

There are a lot of firestore manipulating packages. But most of them use exclusive implementation e.g. custom class, which means you CAN NOT get back to original firestore easily even if it doesn't provide enough utilities. But when it comes to `firefuse`, it couldn't happen, because `firefuse` utilities returns original firestore objects such as `DocumentRefence`, `CollectionRefence`, `orderBy`, `where`.
Can't you believe it? So let's take a look at this package.

```js
import * as firestore from "firebase/firestore";
export const collection =
  () =>
  (DB, ...paths) =>
    firestore.collection(DB, paths.join("/"));
export const doc = () => {
  function d(DBorRef, ...paths) {
    if (DBorRef instanceof firestore.CollectionReference) {
      if (typeof paths[0] === "undefined") {
        return firestore.doc(DBorRef);
      } else {
        return firestore.doc(DBorRef, paths[0]);
      }
    } else if (DBorRef instanceof firestore.Firestore) {
      return firestore.doc(DBorRef, paths.join("/"));
    }
  }
  return d;
};
const updateDoc = (doc, data) => firestore.updateDoc(doc, data);
export const where = () => {
  return (field, op, value) => firestore.where(field, op, value);
};
export const orderBy = () => {
  return (field, order) =>
    order ? firestore.orderBy(field, order) : firestore.orderBy(field);
};
```

That's it! No original implementation. All features are provided via Typescript declaration.

## More Demos

```ts
const userCollection = collection(DB, "user"); // ✅
doc(userCollection); // ✅
doc(userCollection, "uid"); // ✅

const where = fuse.where<User>();
const userCol = collection(DB, "user");
firestore.query(userCol, where("sex", "==", "male")); // ✅
firestore.query(userCol, where("sex", "==", "no-data")); // ❌: Argument of type '"no-data"' is not assignable to parameter of type '"male" | "female" | "other"'.
firestore.query(userCol, where("skills", "array-contains", "c")); // ✅
firestore.query(userCol, where("skills", "array-contains", ["c", "java"])); // ❌:Argument of type 'string[]' is not assignable to parameter of type 'string'.
firestore.query(userCol, where("skills", "<", "c++")); // ❌:Argument of type '"<"' is not assignable to parameter of type 'ArrayOp'.
firestore.query(userCol, where("age", "==", 22)); // ✅
firestore.query(userCol, where("age", "==", "22")); // ❌: Argument of type 'string' is not assignable to parameter of type 'number'.
firestore.query(userCol, where("age", "array-contains", 22)); // ❌: Argument of type '"array-contains"' is not assignable to parameter of type 'PrimitiveOp'.

const orderBy = fuse.orderBy<User>();
firestore.query(userCol, orderBy("age")); // ✅
firestore.query(userCol, orderBy("skills")); // ❌: Argument of type '"skills"' is not assignable to parameter of type '"age" | "sex" | "birthDay" | "isStudent"'
```
