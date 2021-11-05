import { DocumentData, StrKeyof } from "../index.js";
import * as admin from "firebase-admin";
import { LegalOperation, LegalValue, WhereData } from "./where.js";
export interface FuseQuery<T extends DocumentData>
  extends admin.firestore.Query<T> {
  where<
    F extends StrKeyof<T>,
    OP extends LegalOperation<T, F>,
    V extends LegalValue<T, F, OP>
  >(
    fieldPath: F,
    opStr: OP,
    value: V
  ): FuseQuery<WhereData<T, F, OP, V>>;
}
