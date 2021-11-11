# firefuse-admin. Definitely typed utilities for firestore

## What can I do with this package?

This is the typescript-first utility package for `firestore`.

`firefuse-admin` provides

1. Fully compatible API with `firebase-admin`. You don't have to learn anything other than original one.
2. Type-safe path.
3. Automatically typed `.doc()` and `.collection()` inferred by the path you sepcified.
4. Type-safe `where()`. For example, prohibiting querying `string` where actually `number` property, removing undefined from specified property, narrowing union type using `==, in, not-in` ... and more!

## Getting started

### install

```sh
npm i firefuse-admin firebase-admin@10
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

### Initialize app

```ts
import * as fuse from "firefuse-admin";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const app = initializeApp();
const DB = getFirestore(app) as fuse.FuseFirestore<Schema>;
```

That's all!

### Get reference

You can't pass an unexist path.

```ts
DB.collection(`user`); // ✅
DB.collection(`users`); // ❌: '"users"' is not assignable to parameter of type '"user" | `user/${string}/payment` | `user/${string}/payment/${string}/paymentLog`'.

DB.doc(`user/uid/payment/pid`); // ✅
DB.doc("user/uid/nowhere/id") // this returns DocumentReference<never>
  .get()
  .then((ss) => ss.data().age); // ❌:'age' does not exist on type 'never'.
```

For nested paths, firefuse-admin returns `DocumentReference<never>` instead of throwing an error at paths. This is because Typescript can't represent any `string` other than `"X"` .

### Construct query

`where` is also type-safe. For example you CANNOT specify `array-contains-any` in not-array field and CANNOT specify `<, <=, >=, >` in not-primitive field.

Currently, `firefuse-admin` doesn't detect illegal query unlike `firefuse`.

```ts
const users = DB.collection(`user`);
users
  .where("age", "==", 22 as const) // ✅
  .get()
  .then((query) => query.docs[0].data().age); // `age` does exist and typed as `22`
users.where("age", "==", "22"); // ❌:'string' is not assignable to parameter of type 'number'.
users.where("age", "array-contains", 22); // ❌:'"array-contains"' is not assignable because `age` is number, not array
users
  .where("sex", "in", ["female", "male"] as const)
  .get()
  .then((ss) => ss.docs[0].data().sex); // sex is typed as "male" | "female"

// NOTE: currently, firefuse-admin doesn't detect illegal query(unlike firefuse)
```
