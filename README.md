# firefuse. Definitely typed utilities for firestore

This is monorepo of `firefuse` and `firefuse-admin`, which correspond `firebase` and `firebase-admin` respectively.

## What can I do with this package?

`firefuse` provides

1. Zero-bundle package.
2. Fully compatible API with `firebase`. You don't have to learn anything other than original one.
3. Type-safe path.
4. Automatically typed `doc()` and `collection()` inferred by the path you sepcified.
5. Type-safe `where()`. For example, prohibiting querying with `string` whose type is actually `number`, removing undefined from specified property, narrowing union type using `==, in, not-in` ... and more!
6. Type-safe `query()`. For example, you CANNOT filter two or more fields, CANNOT order unfilterd field ... and many more. `firefuse` detects all illegal constraints.(`firefuse` only for now)

Details are in each folders.
