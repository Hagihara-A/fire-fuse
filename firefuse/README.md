# firefuse

`firefuse` is a powerful typing utilities for `firestore`.

`firefuse` does nothing in runtime but improves `firebase` type.

## Features

1. Type-safe `doc()` and `collection()`.
2. Type-safe `where()` and `orderBy()`.
3. Type and logic safe `query()`. `firefuse` ensures query is **legal** under firestore's requirements. For example, you CANNOT filter two or more fields. `firefuse` detects all illegal queries on behalf of you.

# Getting started

## install

```sh
npm i firefuse firebase@9
```

`firefuse` is only for `firebase@9` currently.

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

## Cast firestore functions

Then, cast original function with the schema.

```ts
import * as fuse from "fire-fuse";

const doc = firestore.doc as fuse.Doc<AppSchema>;
const collection = firestore.collection as fuse.Collection<AppSchema>;
const query = firestore.query as fuse.Query;
```

That's it!

> NOTE: Cast `where` and `orderBy` for **each document** on your own, because it depends the document type they constrain. `limit, startAt etc...` are document agnostic. You can use them anywhere as long as they are exported by `firefuse`.

# Features

## Type-safe path

You can see `user` is OK while `users` is wrong. Same goes for `doc()`.

```ts
collection(DB, "user"); // ✅
collection(
  DB,
  // @ts-expect-error. ❌ users is wrong.
  "users"
);
```

## Returned snapshot is also typed

```ts
const userDoc = doc(DB, "user", "general", "users", "xxx");
const user = await firestore.getDoc(userDoc);
const d: User | undefined = user.data(); // User | undefined
```

## Type-safe where() and orderBy()

`firefuse` prohibits you from applying `array-contains-any` to non-array fields.

Args of `where()` is strictly typed.

```ts
const userWhere = firestore.where as fuse.Where<User>; // Cast `where` for each document on your own
userWhere("name", "==", "aaa"); // ✅
userWhere(
  "name",
  "==",
  // @ts-expect-error. Name field must be string
  22
);
userWhere(
  "permissions",
  "array-contains",
  // @ts-expect-error. permission must be ("create" | "read" | "update" | "delete")[]
  ["xxx"]
);
```

`orderBy()` as well.

```ts
const userOrderBy = firestore.orderBy as fuse.OrderBy<User>;
userOrderBy("name"); // ✅
userOrderBy(
  // @ts-expect-error. ❌ "xxx" is not field of User document
  "xxx"
);
```

## Type-safe query()

`firefuse` introduce smarter type inference to `query()`.
In the below example, `age` is `number | undefined` according to the schema, but it's inferred as `number` after queried.

```ts
const q = query(generalUser, userWhere("age", ">", 20)); // ✅
const { docs } = await firestore.getDocs(q);
const age: number = docs[0].data().age; // ✅ Now, age is `number`. Not `number | undefined.`
```

And, if you query with `as const` clause, `query()` narrows field type.
In the following code, `name` is inferred as `"arark"`, not `string`.

```ts
const q = query(generalUser, userWhere("name", "==", "arark" as const));
const { docs } = await firestore.getDocs(q);
docs[0].data().name === "arark"; // ✅  name is "arark". Not `string`.
```

## Logic-safe query()

`firefuse` detects all illegal queries. Details [here](https://firebase.google.com/docs/firestore/query-data/queries#query_limitations). This feature is not available in `firefuse-admin` currently.

### example1

In this code, `query()` returns `never` because becasue you can perform range (<, <=, >, >=) or not equals (!=) comparisons only on a single field.

```ts
// ❌ You will get `never` becasue you can perform range (<, <=, >, >=) or not equals (!=) comparisons only on a single field
const q: never = query(
  generalUser,
  userWhere("name", ">", "xxx"),
  userWhere("age", ">", 20)
);
```

### example2

In a compound query, range (<, <=, >, >=) and not equals (!=, not-in) comparisons must all filter on the same field.

```ts
// ❌ You will get `never`
// In a compound query, range (<, <=, >, >=) and not equals (!=, not-in) comparisons must all filter on the same field.
const q: never = query(
  generalUser,
  userWhere("age", ">", 22),
  userWhere("name", "not-in", ["xxx"])
);
```

### example3

If you include a filter with a range comparison (<, <=, >, >=), your first ordering must be on the same field

```ts
// ❌ You will get `never`
// if you include a filter with a range comparison (<, <=, >, >=), your first ordering must be on the same field
const q: never = query(
  generalUser,
  userWhere("age", "<", 22),
  userOrderBy("name")
);
```

# Troubleshooting

## My schema is not assignable to firefuse.Schema

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
