import * as fst from "firebase/firestore";

export interface OrderBy<T> {
  <F extends keyof T>(
    field: F,
    order?: fst.OrderByDirection
  ): OrderByConstraint<T, F>;
}

export interface OrderByConstraint<T, F extends keyof T>
  extends fst.QueryConstraint {
  readonly type: Extract<fst.QueryConstraintType, "orderBy">;
  field: F;
}
