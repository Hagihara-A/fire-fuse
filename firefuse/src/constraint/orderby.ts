import * as firestore from "firebase/firestore";

import { DocumentData } from "../index.js";
import { Orderable } from "./where.js";

export type KeyofOrderable<T extends DocumentData> = keyof T extends infer K
  ? K extends Orderable
    ? K
    : never
  : never;
export interface OrderBy<T extends DocumentData> {
  <F extends KeyofOrderable<T> & string>(
    field: F,
    order?: firestore.OrderByDirection
  ): OrderByConstraint<F>;
}

export const orderBy = <T extends DocumentData>(): OrderBy<T> => {
  return <F extends KeyofOrderable<T>>(
    field: F,
    order?: firestore.OrderByDirection
  ) => firestore.orderBy(field, order) as OrderByConstraint<F>;
};

export interface OrderByConstraint<F extends string>
  extends firestore.QueryConstraint {
  readonly type: Extract<firestore.QueryConstraintType, "orderBy">;
  field: F;
}
