import * as fst from "firebase/firestore";
import { Defined, DocumentData, ExcUndef, Schema, StrKeyof } from "./index.js";
import { OrderByConstraint } from "./constraint/orderby.js";
import { OtherConstraints } from "./constraint/other.js";
import { WhereConstraint, GreaterOrLesserOp } from "./constraint/where.js";
import { GetData } from "./GetData.js";
import { DocumentPaths } from "./doc.js";
import { QueryConstraint } from "./constraint/QueryConstraint.js";

export interface Query<S extends Schema> {
  <D extends GetData<S, DocumentPaths<S>>, CS extends QueryConstraint<D>[]>(
    query: fst.Query<D>,
    ...queryConstraints: CS
  ): ConstrainedData<D, CS> extends infer CD
    ? CD extends never
      ? never
      : fst.Query<CD>
    : never;
}

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
  C extends readonly QueryConstraint<T>[],
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
  ? Rest extends readonly QueryConstraint<T>[]
    ? H extends WhereConstraint<infer U, infer F, infer OP, infer V>
      ? T extends U
        ? OP extends GreaterOrLesserOp
          ? F extends Mem["rangeField"]
            ? ConstrainedData<Defined<T, F>, Rest, Mem & { rangeField: F }>
            : never
          : OP extends "=="
          ? ConstrainedData<
              T & { [L in F]-?: V },
              Rest,
              OR<Mem, { eqField: F }>
            >
          : OP extends "!="
          ? Mem["prevNot"] extends true
            ? never
            : F extends Mem["rangeField"]
            ? ConstrainedData<
                T &
                  {
                    [L in F]-?: ExcUndef<T[L]> extends V
                      ? ExcUndef<T[L]>
                      : Exclude<T[L], V | undefined>;
                  },
                Rest,
                OverWrite<Mem, { prevNot: true }> & { rangeField: F }
              >
            : never
          : OP extends "array-contains"
          ? Mem["prevArrcon"] extends true
            ? never
            : ConstrainedData<
                Defined<T, F>,
                Rest,
                OverWrite<Mem, { prevArrcon: true }>
              >
          : OP extends "array-contains-any"
          ? Mem["prevArrcon"] extends true
            ? never
            : Mem["prevOr"] extends true
            ? never
            : ConstrainedData<
                Defined<T, F>,
                Rest,
                OverWrite<Mem, { prevArrcon: true; prevOr: true }>
              >
          : OP extends "in"
          ? Mem["prevOr"] extends true
            ? never
            : V extends readonly T[F][]
            ? ConstrainedData<
                T & { [L in F]-?: V[number] },
                Rest,
                OR<OverWrite<Mem, { prevOr: true }>, { eqField: F }>
              >
            : never
          : OP extends "not-in"
          ? Mem["prevOr"] extends true
            ? never
            : Mem["prevNot"] extends true
            ? never
            : F extends Mem["rangeField"]
            ? V extends readonly T[F][]
              ? ConstrainedData<
                  T &
                    {
                      [L in F]-?: T[L] extends V[number]
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

export type OR<T, U extends { [K in keyof T]?: unknown }> = {
  [K in keyof T]: K extends keyof U ? T[K] | U[K] : T[K];
};
export type OverWrite<
  T extends DocumentData,
  U extends { [K in keyof T]?: unknown }
> = {
  [K in keyof T]: K extends keyof U ? U[K] : T[K];
};
