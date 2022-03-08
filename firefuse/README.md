# firefuse. Definitely typeing utilities for firestore.

`firefuse` provides zero-runtime utilities for `firestore`. `firefuse` introduce type strictness to your code.

You can go back to original `firestore` if `firefuse` is inconvinient, because `firefuse` just cast `firestore`'s type.

## Features

1. Type-safe path.
1. Argumants and return value of `doc()` and `collection()` are typed.
1. Type-safe `where()` and `orderBy()`. For example, prohibiting querying with `string` whose type is actually `number`, cannot use `array-contains` for non-array field ... and more!
1. Type and logic safe `query()`. Querid field is strictly typed and `firefuse` ensures query is **legal** under firestore's requirements. For example, you CANNOT filter two or more fields, order unfilterd field ... and many more. `firefuse` detects all illegal query on behalf of you.

## Getting started

### install

```sh
npm i firefuse firebase@9
```

### Define Your schema

`Schema` is just plain Typescript's type. Interface is following.

```ts
export interface Schema {
  [CollectionKey: string]: {
    [DocuemntKey: string]: {
      doc: DocumentData;
      col?: Schema;
    };
  };
}
```

This is example

```ts
type AppSchema = {
  cities: {
    v1: {
      doc: Record<string, never>;
      col: {
        cities: {
          [DocKey: string]: { doc: City };
        };
      };
    };
    v2: {
      doc: Record<string, never>;
      col: {
        newCities: {
          [DocKey: string]: { doc: CityV2 };
        };
      };
    };
  };
};
```

In this Schema, `cities` and `newCities` are collection names. `v1` and `v2` are document keys, which don't have any data in it.

> NOTE: you can't use `Date` in your schema because firestore convert `Date` into `Timestamp` automatically.

### Cast firestore functions

```ts
const doc = firestore.doc as unknown as fuse.Doc<AppSchema>;
const collection =
  firestore.collection as unknown as fuse.Collection<AppSchema>;
const query = firestore.query as fuse.Query<AppSchema>;
const cityWhere = firestore.where as fuse.Where<City>;
const cityOrderBy = firestore.orderBy as fuse.OrderBy<City>;
```

That's it!

> NOTE: Cast `where` and `orderBy` for **each document** on your own, because it depends the document type they constrain. `limit, startAt etc...` are type agnostic. You can use them anywhere as long as they are exported by `firefuse`.

### Use them

Use as you did. `firefuse` provides almost compatible API with `firestore`.

Then I will show how powerful `fuirefuse` is.

## Type-safe path

When you pass a wrong path, `firefuse` throws error.You can see `user` is OK, while `users` is wrong.

```ts
collection(DB, "user"); // ✅
collection(DB, "users"); // ❌ "users" is wrong
collection(DB, "user", "uid", "favRooms"); // ✅
collection(DB, "user", "uid", "favRoom"); // ❌ "favRoom" is wrong

doc(DB, "cities", "v1", "cities", "id"); // ✅
doc(DB, "cities", "v2", "cities", "id"); // ❌ "cities" does not exsit under "v1"
```

## Returned snapshot is also typed

```ts
const cityDocs = await firestore.getDocs(
  collection(DB, "cities", "v1", "cities")
);
cityDocs.docs.map((doc) => {
  const city = doc.data(); // Now, city is typed as `City`
});
```

## Type-safe where() and orderBy()

`firefuse` enable `where()` and `orderBy()` to be much more type-safe. For example you CANNOT specify `array-contains-any` in not-array field, CANNOT specify `<, <=, >=, >` in not-primitive field.

It's actually possible. If you **really** need it, please use original `firestore`.

Args of `where()` is strictly typed.

```ts
const cityWhere = firestore.where as fuse.Where<City>; // Cast `where` for each document on your own
cityWhere("name", "==", "Tokyo"); // ✅
cityWhere("name", "==", 22); // ❌ name field is `string`
cityWhere("regions", "array-contains-any", ["c"]); // ✅
cityWhere("regions", ">", ["c"]); // ❌ ">" is not allowed to query an array field
```

`orderBy()` as well.

```ts
const cityOrderBy = firestore.orderBy as fuse.OrderBy<City>;
cityOrderBy("name"); // ✅
cityOrderBy("regions"); // ❌ Can not sort by array field
```

## Type-safe query()

`firefuse` introduce more smart type inference to `query()`.
In the below example, `population` is optional in `Schema`, but not optional after queried.

```ts
const cityCol = collection(DB, "cities", "v1", "cities");
const q1 = query(
  cityCol,
  cityWhere("population", ">", 22),
  cityWhere("population", "<", 30)
); // ✅
firestore.getDocs(q1).then(
  (ss) => ss.docs.map((doc) => doc.data().population) // Now, `population` is `number`, not `number | undefined`. Because queried filed must exist
);
```

And, if you query with `as const`, `query()` narrows field type.
In the following code, `doc.data().name` is typed as `"tokyo"`, not `string`.

```ts
const q2 = query(cityCol, cityWhere("name", "==", "tokyo" as const)); // ✅: note `as const`
firestore
  .getDocs(q2)
  .then((qs) => qs.docs.map((doc) => doc.data().name === "tokyo")); // Now, name is typed as `"tokyo"` because you queried it !!
```

## Logic-safe query()

`firefuse` detects all illegal queries. Details [here](https://firebase.google.com/docs/firestore/query-data/queries#query_limitations). This is not available in `firefuse-admin` currently.

### example1

In this code, `query()` returns `never` because becasue you can perform range (<, <=, >, >=) or not equals (!=) comparisons only on a single field.

```ts
query(
  cityCol,
  cityWhere("population", ">", 22),
  cityWhere("name", "!=", "Tokyo")
); // ❌: You will get `never`
```

### example2

In a compound query, range (<, <=, >, >=) and not equals (!=, not-in) comparisons must all filter on the same field.

```ts
query(
  cityCol,
  cityWhere("population", ">", 22),
  cityWhere("name", "not-in", ["tokyo"])
); // You will get `never`
```

## Complete Demo

[here](https://githubbox.com/Hagihara-A/fire-fuse/blob/master/firefuse/demo.ts)
