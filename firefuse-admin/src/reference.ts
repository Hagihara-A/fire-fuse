import { DocumentReference } from "@google-cloud/firestore";

import { DocumentData } from "./index.js";
import { Update } from "./update.js";

export interface FuseDocumentReference<T extends DocumentData>
  extends DocumentReference<T> {
  update: Update<T>;
}
