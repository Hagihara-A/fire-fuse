import * as fuse from "firefuse";
import * as firestore from "firebase/firestore";

type Schema = {
  user: {
    doc: User;
    subcollection: {
      payment: {
        doc: Payment;
        subcollection: {
          paymentLog: {
            doc: PaymentLog;
          };
        };
      };
    };
  };
};
type User = {
  name: { first: string; last: number; middle?: string };
  age?: number;
  sex?: "male" | "female" | "other";
  birthDay: firestore.Timestamp;
  skills?: string[];
  isStudent: boolean;
};

type Payment = {
  company: string;
  cardNumber: number;
  expire: firestore.Timestamp;
};

type PaymentLog = {
  settledAt: firestore.Timestamp;
  amount: number;
};

const DB = firestore.getFirestore();
const collection = firestore.collection as fuse.Collection<Schema>;
const doc = firestore.doc as fuse.Doc<Schema>;

collection(DB, "user"); // ✅
collection(DB, "users"); // ❌: Type '"users"' is not assignable to type '"user"'
collection(DB, "user", "uid", "payment", "pid", "paymentLog"); // ✅
collection(DB, "user", "uid", "payment", "pid", "paymentsLog"); // ❌: Type '"paymentsLog"' is not assignable to type '"paymentLog"'

doc(DB, "user", "uid"); // ✅
doc(DB, "users", "uid"); // ❌: Type '"users"' is not assignable to type '"user"'
doc(DB, "user", "uid", "payment", "pid", "paymentsLog", "logid"); // ❌: Type '"paymentsLog"' is not assignable to type '"paymentLog"'

const userCollection = collection(DB, "user"); // ✅
doc(userCollection); // ✅
doc(userCollection, "uid"); // ✅

const userCol = collection(DB, "user");
const { query } = fuse;
const where = firestore.where as fuse.Where<User>;
const orderBy = firestore.orderBy as fuse.OrderBy<User>;

where("age", "==", 22); // ✅
where("age", "==", "22"); // ❌: Argument of type 'string' is not assignable to parameter of type 'number'.
where("skills", "array-contains", "c"); // ✅
where("skills", "array-contains", ["c", "java"]); // ❌:Argument of type 'string[]' is not assignable to parameter of type 'string'.

orderBy("age"); // ✅
orderBy("skills"); // ❌: Argument of type '"skills"' is not assignable to parameter of type '"age" | "sex" | "birthDay" | "isStudent"'

const q1 = query(userCol, where("age", ">", 22), where("age", "<", 30)); // ✅: queried docs are typed to have `.age` property
firestore.getDocs(q1).then((qs) => qs.docs.map((doc) => doc.data().age)); // `.age` became required property!!

const q2 = query(userCol, where("age", ">", 22), where("sex", "<", "male")); // ❌: filter on multiple field (firestore's limitation).
firestore.getDocs(q2).then((qs) => qs.docs.map((doc) => doc.data().age)); // doc.data() is never

const q3 = query(
  userCol,
  where("age", ">", 22),
  where("sex", "not-in", ["male"])
); // ❌: "<", "<=", ">=", ">", "!=" and not-in must filter the same field (firestore's limitation).
firestore.getDocs(q3).then((qs) => qs.docs.map((doc) => doc.data().age)); // doc.data() is never

const q4 = query(userCol, where("sex", "!=", "male" as const)); // ✅: note `as const`
firestore.getDocs(q4).then((qs) => qs.docs.map((doc) => doc.data().sex)); // now, sex is `"female" | "other"` because you removed it !!

const q5 = query(userCol, where("age", "==", 30 as const)); // ✅: note `as const`
firestore.getDocs(q5).then((qs) => qs.docs.map((doc) => doc.data().age === 30)); // now age === 30, becase you queried!!

query(
  userCol,
  where("sex", "in", ["female", "male"]),
  where("age", "not-in", [22, 23]),
  where("skills", "array-contains-any", ["c", "java"])
); // ❌:  in, not-in or array-contains-any must not be used at the same time and appear only once (firestore's limitation).

query(userCol, where("age", "<", 22), orderBy("age"), orderBy("birthDay")); // ✅
query(userCol, where("age", ">", 23), orderBy("birthDay")); //❌: if you include a filter with a range comparison (<, <=, >, >=), your first ordering must be on the same field: (firestore's limitation)

// use other constraints
const { limit, limitToLast, startAt, startAfter, endAt, endBefore } = fuse;
