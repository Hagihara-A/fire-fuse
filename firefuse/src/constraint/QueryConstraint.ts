import { StrKeyof } from "../utils.js";
import { OrderByConstraint } from "./orderby.js";
import { OtherConstraint } from "./other.js";
import { LegalOperation, LegalValue, WhereConstraint } from "./where.js";

export type QueryConstraint<
  D,
  F extends StrKeyof<D> = StrKeyof<D>,
  OP extends LegalOperation<D, F> = LegalOperation<D, F>,
  V extends Readonly<LegalValue<D, F, OP>> = Readonly<LegalValue<D, F, OP>>
> = WhereConstraint<D, F, OP, V> | OrderByConstraint<D, F> | OtherConstraint;
