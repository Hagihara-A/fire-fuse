/* eslint-disable @typescript-eslint/no-unused-vars */
import * as firestore from "firebase-admin/firestore";
import * as fuse from "firefuse-admin";

// Define your schema
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

type Permission = "create" | "read" | "update" | "delete";

// @ts-expect-error. firefuse-admin is too complex for tsc. This line is for ignoring recursion limit.
const DB = firestore.getFirestore() as fuse.FuseFirestore<AppSchema>;
// That's it!

DB.collection("user"); // ✅
DB.collection(
  // @ts-expect-error. ❌ users is wrong.
  "users"
);

// doc() can take collection reference
const userCol = DB.collection("user"); // ✅
userCol.doc("general"); // ✅
userCol.doc(
  // @ts-expect-error. "xxx" is neither "admin" nor "general"
  "xxx"
);
// @ts-expect-error. Auto generated id is neither "admin" nor "general"
userCol.doc();

const userDoc = DB.doc("user/general/users/xxx");
const user = await userDoc.get();
const d: User | undefined = user.data(); // User | undefined

// Args of where() are typed
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

// Args of orderBy() are typed
users.orderBy("name"); // ✅
users.orderBy(
  // @ts-expect-error. ❌ "xxx" is not field of User document
  "xxx"
);

{
  // Return value of query() is typed depending on your contraints.
const q = users.where("age", ">", 20); // ✅
const { docs } = await q.get();
const age: number = docs[0].data().age; // ✅ Now, age is `number`. Not `number | undefined.`
}
{
  // `as const` narrows type
const q = users.where("name", "==", "arark" as const);
const { docs } = await q.get();
docs[0].data().name === "arark"; // ✅  name is "arark". Not `string`.
}
// query() detects all illegal constraints.
{
  // example1
  // ❌ You will get `never` becasue you can perform range (<, <=, >, >=) or not equals (!=) comparisons only on a single field
  const q: never = users.where("name", ">", "xxx").where("age", ">", 20);
}
{
  // example2
  // ❌ You will get `never`
  // In a compound query, range (<, <=, >, >=) and not equals (!=, not-in) comparisons must all filter on the same field.
  const q: never = users.where("age", ">", 22).where("name", "not-in", ["xxx"]);
}
{
  // example3
  // ❌ You will get `never`
  // if you include a filter with a range comparison (<, <=, >, >=), your first ordering must be on the same field
  const q: never = users.where("age", "<", 22).orderBy("name");
}
