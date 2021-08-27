import * as firestore from "firebase/firestore";
export const fireFuse = (DB) => {
    const collection = (...paths) => firestore.collection(DB, paths.join("/"));
    const doc = (...paths) => firestore.doc(DB, paths.join("/"));
    return { collection, doc };
};
const collection = (db, ...paths) => firestore.collection(db, ...paths);
// const { collection, doc } = fireFuse<MySchema>(DB);
const colRef = collection(DB, "user", "asdas", "payment");
// const docRef = doc("C1", "asdasd", "C2", "asdas");
