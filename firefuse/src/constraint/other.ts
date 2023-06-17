import * as fst from "firebase/firestore";

export type OtherConstraint =
  | fst.QueryLimitConstraint
  | fst.QueryStartAtConstraint
  | fst.QueryEndAtConstraint;
