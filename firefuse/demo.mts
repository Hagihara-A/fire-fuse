/* eslint-disable @typescript-eslint/no-unused-vars */
import * as firestore from "firebase/firestore";
import * as fuse from "firefuse";

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

const DB = firestore.getFirestore();

// Second, cast original functions with firefuse's ones
const doc = firestore.doc as fuse.Doc<AppSchema>;
const collection = firestore.collection as fuse.Collection<AppSchema>;
const query = firestore.query as fuse.Query;
// That's it!

collection(DB, "user"); // ✅
collection(
  DB,
  // @ts-expect-error. ❌ users is wrong.
  "users"
);

// doc() can take collection reference
const userCol = collection(DB, "user"); // ✅
doc(userCol, "general"); // ✅
// @ts-expect-error. "xxx" is neither "admin" nor "general"
doc(userCol, "xxx");
// @ts-expect-error. Auto generated id is neither "admin" nor "general"
doc(userCol);

const userDoc = doc(DB, "user", "general", "users", "xxx");
const user = await firestore.getDoc(userDoc);
const d: User | undefined = user.data(); // User | undefined

// Args of where() are typed
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

// Args of orderBy() are typed
const userOrderBy = firestore.orderBy as fuse.OrderBy<User>;
userOrderBy("name"); // ✅
userOrderBy(
  // @ts-expect-error. ❌ "xxx" is not field of User document
  "xxx"
);

const generalUser = collection(DB, "user", "general", "users");

{
  // Return value of query() is typed depending on your contraints.
  const q = query(generalUser, userWhere("age", ">", 20)); // ✅
  const { docs } = await firestore.getDocs(q);
  const age: number = docs[0].data().age; // ✅ Now, age is `number`. Not `number | undefined.`
}
{
  // `as const` narrows type
  const q = query(generalUser, userWhere("name", "==", "arark" as const));
  const { docs } = await firestore.getDocs(q);
  docs[0].data().name === "arark"; // ✅  name is "arark". Not `string`.
}
// query() detects all illegal constraints.
{
  // example1
  // ❌ You will get `never` becasue you can perform range (<, <=, >, >=) or not equals (!=) comparisons only on a single field
  const q: never = query(
    generalUser,
    userWhere("name", ">", "xxx"),
    userWhere("age", ">", 20)
  );
}
{
  // example2
  // ❌ You will get `never`
  // In a compound query, range (<, <=, >, >=) and not equals (!=, not-in) comparisons must all filter on the same field.
  const q: never = query(
    generalUser,
    userWhere("age", ">", 22),
    userWhere("name", "not-in", ["xxx"])
  );
}
{
  // example3
  // ❌ You will get `never`
  // if you include a filter with a range comparison (<, <=, >, >=), your first ordering must be on the same field
  const q: never = query(
    generalUser,
    userWhere("age", "<", 22),
    userOrderBy("name")
  );
}

// Other constraints
import {
  endAt,
  endBefore,
  limit,
  limitToLast,
  startAfter,
  startAt,
} from "firebase/firestore";
query(
  generalUser,
  endAt(1),
  endBefore(1),
  limit(1),
  limitToLast(1),
  startAfter(1),
  startAt(1)
);
