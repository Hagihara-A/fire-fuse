import { DocumentData } from "./index.js";

export type ExcUndef<T> = Exclude<T, undefined>;

export type Defined<T extends DocumentData, K extends StrKeyof<T>> = T & {
  [L in K]-?: ExcUndef<T[K]>;
};

export type StrKeyof<T> = keyof T & string;
