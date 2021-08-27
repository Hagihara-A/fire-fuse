import * as firestore from "firebase/firestore";
declare type SchemaBase = {
    [K in string]: {
        doc: firestore.DocumentData;
        subcollection?: SchemaBase;
    };
};
declare type CollectionPaths<S extends SchemaBase> = {
    [K in string & keyof S]: S[K]["subcollection"] extends SchemaBase ? [K] | [K, string, ...CollectionPaths<S[K]["subcollection"]>] : [K];
}[string & keyof S];
export declare const fireFuse: <S extends SchemaBase>(DB: any) => {
    collection: <P extends CollectionPaths<S>>(...paths: P) => any;
    doc: <P_1 extends [...CollectionPaths<S>, string]>(...paths: P_1) => any;
};
export {};
