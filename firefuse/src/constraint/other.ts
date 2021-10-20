import * as firestore from "firebase/firestore";

export interface OtherConstraints extends firestore.QueryConstraint {
  readonly type: Exclude<firestore.QueryConstraintType, "where" | "orderBy">;
}

export const limit = (limit: number) =>
  firestore.limit(limit) as OtherConstraints;
export const limitToLast = (limit: number) =>
  firestore.limitToLast(limit) as OtherConstraints;

export function startAt(
  snapshot: firestore.DocumentSnapshot<unknown>
): OtherConstraints;
export function startAt(...fieldValues: unknown[]): OtherConstraints;
export function startAt(
  ...fieldValues: [firestore.DocumentSnapshot<unknown>] | unknown[]
) {
  return firestore.startAt(...fieldValues) as OtherConstraints;
}

export function startAfter(
  snapshot: firestore.DocumentSnapshot<unknown>
): OtherConstraints;
export function startAfter(...fieldValues: unknown[]): OtherConstraints;
export function startAfter(
  ...fieldValues: unknown[] | [firestore.DocumentSnapshot<unknown>]
) {
  return firestore.startAfter(...fieldValues);
}

export function endAt(
  snapshot: firestore.DocumentSnapshot<unknown>
): OtherConstraints;
export function endAt(...fieldValues: unknown[]): OtherConstraints;
export function endAt(
  ...fieldValues: [firestore.DocumentSnapshot<unknown>] | unknown[]
) {
  return firestore.endAt(...fieldValues) as OtherConstraints;
}

export function endBefore(
  snapshot: firestore.DocumentSnapshot<unknown>
): OtherConstraints;
export function endBefore(...fieldValues: unknown[]): OtherConstraints;
export function endBefore(
  ...fieldValues: [firestore.DocumentSnapshot<unknown>] | unknown[]
) {
  return firestore.endBefore(...fieldValues) as OtherConstraints;
}
