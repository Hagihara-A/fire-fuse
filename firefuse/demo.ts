import * as fuse from "firefuse";
import * as firestore from "firebase/firestore";

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

const where = fuse.where<User>();
const userCol = collection(DB, "user");
firestore.query(userCol, where("sex", "==", "male")); // ✅
firestore.query(userCol, where("sex", "==", "no-data")); // ❌: Argument of type '"no-data"' is not assignable to parameter of type '"male" | "female" | "other"'.
firestore.query(userCol, where("skills", "array-contains", "c")); // ✅
firestore.query(userCol, where("skills", "array-contains", ["c", "java"])); // ❌:Argument of type 'string[]' is not assignable to parameter of type 'string'.
firestore.query(userCol, where("skills", "<", "c++")); // ❌:Argument of type '"<"' is not assignable to parameter of type 'ArrayOp'.
firestore.query(userCol, where("age", "==", 22)); // ✅
firestore.query(userCol, where("age", "==", "22")); // ❌: Argument of type 'string' is not assignable to parameter of type 'number'.
firestore.query(userCol, where("age", "array-contains", 22)); // ❌: Argument of type '"array-contains"' is not assignable to parameter of type 'PrimitiveOp'.

const orderBy = fuse.orderBy<User>();
firestore.query(userCol, orderBy("age")); // ✅
firestore.query(userCol, orderBy("skills")); // ❌: Argument of type '"skills"' is not assignable to parameter of type '"age" | "sex" | "birthDay" | "isStudent"'
