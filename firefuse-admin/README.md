# firefuse-admin

`firefuse-admin` is a powerful typing utilities for `firebase-admin`.

`firefuse-admin` does nothing in runtime but improves `firebase` type.

## Features

1. Type-safe `doc()` and `collection()`.
2. Type-safe `where()` and `orderBy()`.

# Getting started

## install

```sh
npm i firefuse-admin firebase-admin@10
```

`firefuse-admin` is only for `firebase-admin@10` currently.

## Define Your schema

`Schema` is just a plain Typescript's type.

This is the example

```ts
type AppSchema = {
  // /user
  user: {
    // user/general
    general: {
      doc: Record<string, never>;
      col: {
        // /user/general/users
        users: {
          // /user/general/users/${id}
          [id: string]: { doc: User };
        };
      };
    };
    // /user/admin
    admin: {
      doc: Record<string, never>;
      col: {
        // /users/admin/users
        users: {
          // /users/admin/users/${id}
          [id: string]: { doc: AdminUser };
        };
      };
    };
  };
};

type User = {
  name: string;
  age?: number;
  sex: "male" | "female" | "other";
  permissions: Permission[];
};

type AdminUser = {
  fullName: string;
  phoneNumbers: string[];
  emails: string[];
  permissions: Permission[];
};
```

Schema defines your firestore structure. `doc` field is the type of document and `col` field is the type of subcollection.

> NOTE: you can't use `Date` in your schema. Use `Timestamp` instead.

## Cast firestore

Then, cast firestore with the schema.

```ts
import * as firestore from "firebase-admin/firestore";
import * as fuse from "firefuse-admin";
// @ts-expect-error. firefuse-admin is too complex for tsc. This line is for ignoring recursion limit.
const DB = firestore.getFirestore() as fuse.FuseFirestore<AppSchema>;
```

That's it!

# Features

## Type-safe path

You can see `user` is OK while `users` is wrong. Same goes for `doc()`.

```ts
DB.collection("user"); // ✅
DB.collection(
  // @ts-expect-error. ❌ users is wrong.
  "users"
);
```

## Returned snapshot is also typed

```ts
const userDoc = DB.doc("user/general/users/xxx");
const user = await userDoc.get();
const d: User | undefined = user.data(); // User | undefined
```

## Type-safe where() and orderBy()

`firefuse-admin` prohibits you from applying `array-contains-any` to non-array fields.

Args of `where()` is strictly typed.

```ts
const users = DB.collection("user/general/users");
users.where("name", "==", "aaa"); // ✅
users.where(
  "name",
  "==",
  // @ts-expect-error. Name field must be string
  22
);
users.where(
  "permissions",
  "array-contains",
  // @ts-expect-error. permission must be ("create" | "read" | "update" | "delete")[]
  ["xxx"]
);
```

`orderBy()` as well.

```ts
users.orderBy("name"); // ✅
users.orderBy(
  // @ts-expect-error. ❌ "xxx" is not field of User document
  "xxx"
);
```

## Type-safe query()

`firefuse-admin` introduce smarter type inference to `query()`.
In the below example, `age` is `number | undefined` according to the schema, but it's inferred as `number` after queried.

```ts
const q = users.where("age", ">", 20); // ✅
const { docs } = await q.get();
const age: number = docs[0].data().age; // ✅ Now, age is `number`. Not `number | undefined.`
```

And, if you query with `as const` clause, `query()` narrows field type.
In the following code, `name` is inferred as `"arark"`, not `string`.

```ts
const q = users.where("name", "==", "arark" as const);
const { docs } = await q.get();
docs[0].data().name === "arark"; // ✅  name is "arark". Not `string`.
```

# Troubleshooting

## My schema is not assignable to firefuse-admin.Schema

Probably you are using `interface` in your schema. please use `type`.

If you want to use `interaface`, define document's data type like this.

```ts
interface A {
  a: number;
  [K: string]: number | never; // if this line is missing, you will get an error.
}
type S = {
  colName: {
    [Dockey: string]: { doc: A };
  };
};
```

Note that `[K: string]: number | never`. This line is necessary for using `interface`.
