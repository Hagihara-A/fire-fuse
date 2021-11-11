import * as firestore from "firebase/firestore";

import { DocumentData, KeyofPrimitive } from "../index.js";

export interface OrderBy<T extends DocumentData> {
  <F extends KeyofPrimitive<T> & string>(
    field: F,
    order?: firestore.OrderByDirection
  ): OrderByConstraint<F>;
}

export const orderBy = <T extends DocumentData>(): OrderBy<T> => {
  return <F extends KeyofPrimitive<T> & string>(
    field: F,
    order?: firestore.OrderByDirection
  ) => firestore.orderBy(field, order) as OrderByConstraint<F>;
};

export interface OrderByConstraint<F extends string>
  extends firestore.QueryConstraint {
  readonly type: Extract<firestore.QueryConstraintType, "orderBy">;
  field: F;
}
