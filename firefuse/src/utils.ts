export type ExcUndef<T> = Exclude<T, undefined>;

export type Defined<T, K extends keyof T> = T & {
  [L in K]-?: ExcUndef<T[K]>;
};

export type StrKeyof<T> = keyof T & string;
