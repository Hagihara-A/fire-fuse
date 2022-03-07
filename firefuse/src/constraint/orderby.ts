import * as fst from "firebase/firestore";

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
    order?: fst.OrderByDirection
  ): OrderByConstraint<F>;
}

export interface OrderByConstraint<F extends string>
  extends fst.QueryConstraint {
  readonly type: Extract<fst.QueryConstraintType, "orderBy">;
  field: F;
}
