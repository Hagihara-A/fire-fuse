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
  age: number;
  sex: "male" | "female" | "other";
  birthDay: firestore.Timestamp;
  skills: string[];
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
const collection = fuse.collection<Schema>();
const doc = fuse.doc<Schema>();

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
const where = fuse.where<User>();
const orderBy = fuse.orderBy<User>();
where("age", "==", 22); // ✅
where("age", "==", "22"); // ❌: Argument of type 'string' is not assignable to parameter of type 'number'.
where("skills", "array-contains", "c"); // ✅
where("skills", "array-contains", ["c", "java"]); // ❌:Argument of type 'string[]' is not assignable to parameter of type 'string'.

orderBy("age"); // ✅
orderBy("skills"); // ❌: Argument of type '"skills"' is not assignable to parameter of type '"age" | "sex" | "birthDay" | "isStudent"'

query(userCol, where("age", ">", 22), where("age", "<", 30)); // ✅: filter on single field
query(userCol, where("age", ">", 22), where("sex", "<", "male")); // ❌: filter on multiple field (firestore's limitation).
query(userCol, where("age", ">", 22), where("sex", "not-in", ["male"])); // ❌: "<", "<=", ">=", ">" and not-in must filter same field (firestore's limitation).

query(
  userCol,
  where("sex", "in", ["female", "male"]),
  where("age", "not-in", [22, 23]),
  where("skills", "array-contains-any", ["c", "java"])
); // ❌:  in, not-in or array-contains-any must not be used at the same time and appear only once (firestore's limitation).

query(userCol, where("age", "<", 22), orderBy("age"), orderBy("birthDay")); // ✅
query(userCol, where("age", ">", 23), orderBy("birthDay")); //❌: first orderBy's field must be filtered field in where(firestore's limitation)

// use other constraints
const { limit, limitToLast, startAt, startAfter, endAt, endBefore } = fuse;

const { query, limit, limitToLast, startAt, startAfter, endAt, endBefore } =
  fuse;
