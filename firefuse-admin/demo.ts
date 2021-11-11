import { Timestamp } from "firebase-admin/firestore";
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
  birthDay: Timestamp;
  skills?: string[];
  isStudent: boolean;
};

type Payment = {
  company: string;
  cardNumber: number;
  expire: Timestamp;
};

type PaymentLog = {
  settledAt: Timestamp;
  amount: number;
};

import * as fuse from "firefuse-admin";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const app = initializeApp();
const DB = getFirestore(app) as fuse.FuseFirestore<Schema>;

DB.collection(`user`); // ✅
DB.collection(`users`); // ❌: '"users"' is not assignable to parameter of type '"user" | `user/${string}/payment` | `user/${string}/payment/${string}/paymentLog`'.

DB.doc(`user/uid/payment/pid`); // ✅
DB.doc("user/uid/nowhere/id") // this returns DocumentReference<never>
  .get()
  .then((ss) => ss.data().age); // ❌:'age' does not exist on type 'never'.

const users = DB.collection(`user`);
users
  .where("age", "==", 22 as const) // ✅
  .get()
  .then((query) => query.docs[0].data().age); // `age` does exist and, typed as `22`
users.where("age", "==", "22"); // ❌:'string' is not assignable to parameter of type 'number'.
users.where("age", "array-contains", 22); // ❌:'"array-contains"' is not assignable
users
  .where("sex", "in", ["female", "male"] as const)
  .get()
  .then((ss) => ss.docs[0].data().sex); // sex is typed as "male" | "female"
// WARN!!: currently, firefuse-admin doesn't detect illegal query(unlike firefuse)
