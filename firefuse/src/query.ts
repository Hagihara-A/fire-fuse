import * as firestore from "firebase/firestore";
import { DocumentData, ExcUndef, StrKeyof } from "./index.js";
import { OrderByConstraint } from "./constraint/orderby.js";
import { OtherConstraints } from "./constraint/other.js";
import { WhereConstraint, Defined, OR, OverWrite, GreaterOrLesserOp } from "./constraint/where.js";

export const query = <
  T extends DocumentData,
  CS extends readonly firestore.QueryConstraint[]
>(
  query: firestore.Query<T>,
  ...queryConstraints: CS
) => {
  return firestore.query(query, ...queryConstraints) as firestore.Query<
    ConstrainedData<T, CS>
  >;
};

// // クエリかけたフィールドが存在する
// // 不正なクエリならnever
export type Memory<T extends DocumentData> = {
  rangeField: StrKeyof<T>;
  eqField: StrKeyof<T>;
  prevNot: boolean;
  prevArrcon: boolean;
  prevOr: boolean;
  prevOrderBy: boolean;
};
export type ConstrainedData<
  T extends DocumentData,
  C extends readonly firestore.QueryConstraint[],
  Mem extends Memory<T> = {
    rangeField: StrKeyof<T>;
    eqField: never;
    prevNot: false;
    prevArrcon: false;
    prevOr: false;
    prevOrderBy: false;
  }
> = C extends []
  ? T
  : C extends readonly [infer H, ...infer Rest]
  ? Rest extends readonly firestore.QueryConstraint[]
    ? H extends WhereConstraint<infer U, infer K, infer OP, infer V>
      ? T extends U
        ? OP extends GreaterOrLesserOp
          ? K extends Mem["rangeField"]
            ? ConstrainedData<Defined<T, K>, Rest, Mem & { rangeField: K }>
            : never
          : OP extends "=="
          ? ConstrainedData<
              T & { [L in K]-?: V },
              Rest,
              OR<Mem, { eqField: K }>
            >
          : OP extends "!="
          ? Mem["prevNot"] extends true
            ? never
            : K extends Mem["rangeField"]
            ? ConstrainedData<
                T &
                  {
                    [L in K]-?: T[L] extends V
                      ? T[L]
                      : Exclude<T[L], V | undefined>;
                  },
                Rest,
                OverWrite<Mem, { prevNot: true }> & { rangeField: K }
              >
            : never
          : OP extends "array-contains"
          ? Mem["prevArrcon"] extends true
            ? never
            : ConstrainedData<
                Defined<T, K>,
                Rest,
                OverWrite<Mem, { prevArrcon: true }>
              >
          : OP extends "array-contains-any"
          ? Mem["prevArrcon"] extends true
            ? never
            : Mem["prevOr"] extends true
            ? never
            : ConstrainedData<
                Defined<T, K>,
                Rest,
                OverWrite<Mem, { prevArrcon: true; prevOr: true }>
              >
          : OP extends "in"
          ? Mem["prevOr"] extends true
            ? never
            : V extends readonly T[K][]
            ? ConstrainedData<
                T & { [L in K]-?: V[number] },
                Rest,
                OR<OverWrite<Mem, { prevOr: true }>, { eqField: K }>
              >
            : never
          : OP extends "not-in"
          ? Mem["prevOr"] extends true
            ? never
            : Mem["prevNot"] extends true
            ? never
            : K extends Mem["rangeField"]
            ? V extends readonly T[K][]
              ? ConstrainedData<
                  T &
                    {
                      [L in K]-?: T[L] extends V[number]
                        ? ExcUndef<T[L]>
                        : Exclude<T[L], V[number] | undefined>;
                    },
                  Rest,
                  OverWrite<Mem, { prevOr: true; prevNot: true }>
                >
              : never
            : never
          : never
        : never
      : H extends OrderByConstraint<infer K>
      ? Mem["prevOrderBy"] extends true
        ? ConstrainedData<Defined<T, K>, Rest, Mem>
        : K extends Mem["rangeField"]
        ? ConstrainedData<
            Defined<T, K>,
            Rest,
            OverWrite<Mem, { prevOrderBy: true }>
          >
        : never
      : H extends OtherConstraints
      ? ConstrainedData<T, Rest, Mem>
      : never
    : never
  : never;
