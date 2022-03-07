import * as fst from "firebase/firestore";

export interface OtherConstraints extends fst.QueryConstraint {
  readonly type: Exclude<fst.QueryConstraintType, "where" | "orderBy">;
}

export const limit = (limit: number) =>
  fst.limit(limit) as OtherConstraints;
export const limitToLast = (limit: number) =>
  fst.limitToLast(limit) as OtherConstraints;

export function startAt(
  snapshot: fst.DocumentSnapshot<unknown>
): OtherConstraints;
export function startAt(...fieldValues: unknown[]): OtherConstraints;
export function startAt(
  ...fieldValues: [fst.DocumentSnapshot<unknown>] | unknown[]
) {
  return fst.startAt(...fieldValues) as OtherConstraints;
}

export function startAfter(
  snapshot: fst.DocumentSnapshot<unknown>
): OtherConstraints;
export function startAfter(...fieldValues: unknown[]): OtherConstraints;
export function startAfter(
  ...fieldValues: unknown[] | [fst.DocumentSnapshot<unknown>]
) {
  return fst.startAfter(...fieldValues);
}

export function endAt(
  snapshot: fst.DocumentSnapshot<unknown>
): OtherConstraints;
export function endAt(...fieldValues: unknown[]): OtherConstraints;
export function endAt(
  ...fieldValues: [fst.DocumentSnapshot<unknown>] | unknown[]
) {
  return fst.endAt(...fieldValues) as OtherConstraints;
}

export function endBefore(
  snapshot: fst.DocumentSnapshot<unknown>
): OtherConstraints;
export function endBefore(...fieldValues: unknown[]): OtherConstraints;
export function endBefore(
  ...fieldValues: [fst.DocumentSnapshot<unknown>] | unknown[]
) {
  return fst.endBefore(...fieldValues) as OtherConstraints;
}
