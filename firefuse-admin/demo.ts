import * as fuse from "firefuse-admin";
import * as firestore from "firebase-admin/firestore";

// First of all, please define Schema
type AppSchema = {
  user: {
    [DocKey: string]: {
      doc: User | Count;
      col?: {
        favRooms: { [DocKey: string]: { doc: Room } };
      };
    };
    count: {
      doc: Count;
    };
  };
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

// Second, cast firestore instance with firefuse's ones
//@ts-expect-error firefuse is too complex for tsc. Please add this line to ignore recursion limit.
const DB = firestore.getFirestore() as fuse.FuseFirestore<AppSchema>;
// That's it!

// Path of `collection()` is type-safe even if it's nested
DB.collection("user"); // ✅
DB.collection("users"); // ❌ "users" is wrong
DB.collection("user/uid/favRooms"); // ✅
DB.collection("user/uid/favRoom"); // ❌ "favRoom" is wrong

// Given docs are typed
const cityDocs = await DB.collection("cities/v1/cities").get();
cityDocs.docs.map((doc) => {
  const city = doc.data(); // Now, city is typed as `City`
});

// Path of doc() is also type-safe
DB.doc("cities/v1/cities/id"); // ✅
DB.doc("cities/v2/cities/id"); // ❌ "cities" does not exsit under "v1"

// Given document is also typed
const userOrCountDoc = await DB.doc("user/uid").get();
const data = userOrCountDoc.data(); // Now, data is typed as `User | Count`

// Args of where() are typed
const cityCol = DB.collection("cities/v1/cities"); // Cast `where` for each document on your own
cityCol.where("name", "==", "Tokyo"); // ✅
cityCol.where("name", "==", 22); // ❌ name field is `string`
cityCol.where("regions", "array-contains-any", ["c"]); // ✅
cityCol.where("regions", ">", ["c"]); // ❌ ">" is not allowed to query an array field

// Return value of query() is typed depending on your contraints like where() and orderBy()
const q1 = await cityCol
  .where("population", ">", 22)
  .where("population", "<", 30)
  .get();
// ✅
q1.docs.map((doc) => typeof doc.data().population === "number"); // Now, `population` is `number`, not `number | undefined`. Because queried filed must exist

// `as const` narrows type
const q2 = await cityCol.where("name", "==", "tokyo" as const).get(); // ✅: note `as const`
q2.docs.map((doc) => doc.data().name === "tokyo"); // Now, name is typed as `"tokyo"` because you queried it !!

type User = {
  name: string;
  age: number;
  sex: "male" | "female" | "other";
};

type Room = {
  size: number;
  rooms: {
    living: number;
    dining: number;
    kitchen: number;
  };
  city: firestore.DocumentReference<City>;
};

type Count = {
  allDocumentCount?: number;
};

type City = {
  name: string;
  state: string | null;
  country: string;
  capital?: boolean;
  population?: number;
  regions?: string[];
};

type CityV2 = {
  name: string;
  state: string | null;
  country: string;
  capital?: boolean;
  population?: number;
  regions?: string[];
  createdAt: firestore.Timestamp;
  updatedAt?: firestore.Timestamp[];
  cityV1Ref?: firestore.DocumentReference<City>;
};
