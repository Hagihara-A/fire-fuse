# firefuse

Powerful typing utilities for `firestore`.

`firefuse` does nothing but makes your code much stricter.

You can go back to original `firestore` if `firefuse` is inconvinient, because `firefuse` just cast `firestore`.

## Features

1. Type-safe path.
1. Argumants and return value of `doc()` and `collection()` are typed.
1. Type-safe `where()` and `orderBy()`. For example, prohibiting querying with `string` whose type is actually `number`, cannot use `array-contains` for non-array field ... and more!
1. Type and logic safe `query()`. Querid field is strictly typed and `firefuse` ensures query is **legal** under firestore's requirements. For example, you CANNOT filter two or more fields, order unfilterd field ... and many more. `firefuse` detects all illegal queries on behalf of you.(`firefuse` only for now)

## Details

[firefuse](https://github.com/Hagihara-A/fire-fuse/tree/master/firefuse)

[firefuse-admin](https://github.com/Hagihara-A/fire-fuse/tree/master/firefuse-admin)
