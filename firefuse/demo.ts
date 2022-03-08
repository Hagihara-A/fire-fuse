import * as fuse from "firefuse";
import * as firestore from "firebase/firestore";

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

const DB = firestore.getFirestore();

// Second, cast original functions with firefuse's ones
const doc = firestore.doc as unknown as fuse.Doc<AppSchema>;
const collection =
  firestore.collection as unknown as fuse.Collection<AppSchema>;
const query = firestore.query as fuse.Query<AppSchema>;
// That's it!

// Path of `collection()` is type-safe even if it's nested
collection(DB, "user"); // ✅
collection(DB, "users"); // ❌ "users" is wrong
collection(DB, "user", "uid", "favRooms"); // ✅
collection(DB, "user", "uid", "favRoom"); // ❌ "favRoom" is wrong

// Given docs are typed
const cityDocs = await firestore.getDocs(
  collection(DB, "cities", "v1", "cities")
);
cityDocs.docs.map((doc) => {
  const city = doc.data(); // Now, city is typed as `City`
});

// Path of doc() is also type-safe
doc(DB, "cities", "v1", "cities", "id"); // ✅
doc(DB, "cities", "v2", "cities", "id"); // ❌ "cities" does not exsit under "v1"

// doc() can take collection reference
const userCol = collection(DB, "user"); // ✅
doc(userCol); // ✅
doc(userCol, "uid"); // ✅

// Given document is also typed
const userOrCountDoc = await firestore.getDoc(doc(userCol));
const data = userOrCountDoc.data(); // Now, data is typed as `User | Count`

// Args of where() are typed
const cityWhere = firestore.where as fuse.Where<City>; // Cast `where` for each document on your own
cityWhere("name", "==", "Tokyo"); // ✅
cityWhere("name", "==", 22); // ❌ name field is `string`
cityWhere("regions", "array-contains-any", ["c"]); // ✅
cityWhere("regions", ">", ["c"]); // ❌ ">" is not allowed to query an array field

// Args of orderBy() are typed
const cityOrderBy = firestore.orderBy as fuse.OrderBy<City>;
cityOrderBy("name"); // ✅
cityOrderBy("regions"); // ❌ Can not sort by array field

// Return value of query() is typed depending on your contraints like where() and orderBy()
const cityCol = collection(DB, "cities", "v1", "cities");
const q1 = query(
  cityCol,
  cityWhere("population", ">", 22),
  cityWhere("population", "<", 30)
); // ✅
firestore.getDocs(q1).then(
  (ss) => ss.docs.map((doc) => doc.data().population) // Now, `population` is `number`, not `number | undefined`. Because queried filed must exist
);

// `as const` narrows type
const q2 = query(cityCol, cityWhere("name", "==", "tokyo" as const)); // ✅: note `as const`
firestore
  .getDocs(q2)
  .then((qs) => qs.docs.map((doc) => doc.data().name === "tokyo")); // Now, name is typed as `"tokyo"` because you queried it !!

// query() detects all illegal constraints due to firestore's limitation
// example1
query(
  cityCol,
  cityWhere("population", ">", 22),
  cityWhere("name", "!=", "Tokyo")
); // ❌: You will get `never` becasue you can perform range (<, <=, >, >=) or not equals (!=) comparisons only on a single field

// example2
query(
  cityCol,
  cityWhere("population", ">", 22),
  cityWhere("name", "not-in", ["tokyo"])
); // You will get `never`
// In a compound query, range (<, <=, >, >=) and not equals (!=, not-in) comparisons must all filter on the same field.

// example3
query(
  cityCol,
  cityWhere("population", "<", 22),
  cityOrderBy("population"),
  cityOrderBy("name")
); // ✅
query(cityCol, cityWhere("population", "<", 22), cityOrderBy("name")); //❌ This returns `never`
// if you include a filter with a range comparison (<, <=, >, >=), your first ordering must be on the same field: (firestore's limitation)

// use other constraints
const { limit, limitToLast, startAt, startAfter, endAt, endBefore } = fuse;

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
