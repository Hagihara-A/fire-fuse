import * as firestore from "firebase-admin/firestore";
import { DocumentData } from ".";
import { Update } from "./update.js";

export interface FuseDocumentReference<T extends DocumentData>
  extends firestore.DocumentReference<T> {
  update: Update<T>;
}