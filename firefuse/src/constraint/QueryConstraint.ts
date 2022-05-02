import { DocumentData, StrKeyof } from "../index.js";
import { OrderByConstraint } from "./orderby.js";
import { OtherConstraints } from "./other.js";
import { LegalOperation, LegalValue, WhereConstraint } from "./where.js";

export type QueryConstraint<
  D extends DocumentData,
  F extends StrKeyof<D> = StrKeyof<D>,
  OP extends LegalOperation<D, F> = LegalOperation<D, F>,
  V extends Readonly<LegalValue<D, F, OP>> = Readonly<LegalValue<D, F, OP>>
> = WhereConstraint<D, F, OP, V> | OrderByConstraint<F> | OtherConstraints;
