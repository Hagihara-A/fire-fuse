import { Query } from "@google-cloud/firestore";

import { DocumentData, StrKeyof } from "../index.js";
import { LegalOperation, LegalValue, WhereData } from "./where.js";
// import { OrderByDirection } from "@google-cloud/firestore";
// import { Defined } from "../index.js";

export interface FuseQuery<T extends DocumentData> extends Query<T> {
  // orderBy<F extends StrKeyof<T>>(
  //   fieldPath: F,
  //   directionStr: OrderByDirection
  // ): FuseQuery<Defined<T, F>>;

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
