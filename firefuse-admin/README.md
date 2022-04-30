# firefuse-admin

Powerful typing utilities for `firebase-admin/firestore`.

`firefuse-admin` does nothing but makes your code much stricter.

You can go back to original `firestore` if `firefuse-admin` is inconvinient, because `firefuse-admin` just cast `firestore`.

## Features

1. Type-safe path.
1. Argumants and return value of `doc()` and `collection()` are typed.
1. Arguments of `where()` are type safe. For example, prohibiting querying with `string` whose type is actually `number`, cannot use `array-contains` for non-array field ... and more!
1. Return value of `where()` is also typed. Querid field exists certainly and narrows filed type when you queried with `as const` clause etc..

## Demo

[here](https://githubbox.com/Hagihara-A/fire-fuse/blob/master/firefuse-admin/demo.ts)

## Getting started

### install

```sh
npm i firefuse-admin firebase-admin
```

### Define Your schema

`Schema` is just plain Typescript's type.

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

This is the example

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

### Cast firestore

```ts
//@ts-expect-error firefuse is too complex for tsc. Please add this line to ignore recursion limit.
const DB = firestore.getFirestore() as fuse.FuseFirestore<AppSchema>;
```

That's all!

### Use them

Use as you did. `firefuse-admin` provides almost compatible API with `firestore`.

Next, I will show how powerful `firefuse-admin` is.

## Type-safe path

Path is typed besed on the schema. You can't pass wrong path.

In this example, You can see `user` is OK, while `users` is wrong.

```ts
DB.collection("user"); // ✅
DB.collection("users"); // ❌ "users" is wrong
DB.collection("user/uid/favRooms"); // ✅
DB.collection("user/uid/favRoom"); // ❌ "favRoom" is wrong

DB.doc("cities/v1/cities/id"); // ✅
DB.doc("cities/v2/cities/id"); // ❌ "cities" does not exsit under "v1"
```

## Returned snapshot is also typed

`data()` is typed automatically from the path you wrote.

```ts
const cityDocs = await DB.collection("cities/v1/cities").get();
cityDocs.docs.map((doc) => {
  const city = doc.data(); // Now, city is typed as `City`
});
```

## Type-safe where()

`firefuse-admin` makes `where()` be much type-safer. For example you CANNOT specify `array-contains-any` in not-array field, CANNOT specify `<, <=, >=, >` in not-primitive field.

It's actually possible. If you **really** need it, please use original ones.

Args of `where()` is strictly typed.

```ts
const cityCol = DB.collection("cities/v1/cities"); // Cast `where` for each document on your own
cityCol.where("name", "==", "Tokyo"); // ✅
cityCol.where("name", "==", 22); // ❌ name field is `string`
cityCol.where("regions", "array-contains-any", ["c"]); // ✅
cityCol.where("regions", ">", ["c"]); // ❌ ">" is not allowed to query an array field
```

## Type-safe query

`firefuse-admin` introduce more smart type inference to return value of `where()`.
In the below example, `population` is optional in `Schema`, but not optional after queried.

```ts
const q1 = await cityCol
  .where("population", ">", 22)
  .where("population", "<", 30)
  .get();
// ✅
q1.docs.map((doc) => typeof doc.data().population === "number"); // Now, `population` is `number`, not `number | undefined`. Because queried filed must exist
```

And, if you query with `as const` clause, `where()` narrows field type.
In the following code, `doc.data().name` is typed as `"tokyo"`, not `string`.

```ts
const q2 = await cityCol.where("name", "==", "tokyo" as const).get(); // ✅: note `as const`
q2.docs.map((doc) => doc.data().name === "tokyo"); // Now, name is typed as `"tokyo"` because you queried it !!
```

## Logic-safe where()

Sorry! Not yet available unlike `firefuse`.

## Troubleshooting

### My schema is not assignable to firefuse.Schema

Probably, you used `interface` in your schema. please use `type` as possible.

If you want to use `interaface`, define document's data type like this.

```ts
interface A {
  a: number;
  [K: string]: number | never; // if this line is missing, you got an error.
}
type S = {
  colName: {
    [Dockey: string]: { doc: A };
  };
};
```

Note that `[K: string]: number | never`. This line is necessary for `interface`.
