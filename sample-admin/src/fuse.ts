import { FuseFirestore } from "firefuse-admin";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const app = initializeApp();

export const DB = getFirestore(app) as FuseFirestore<Schema>;

export type Schema = {
  users: {
    doc: User;
    subcollection: {
      tweets: { doc: Tweet };
    };
  };
  orgs: {
    doc: Organizations;
    subcollection: {
      tweets: { doc: Tweet };
      payments: { doc: Payment };
    };
  };
};

export type User = {
  name: string;
  age?: number;
  relation: {
    follow?: string[];
    follower?: string[];
  } | null;
  createdAt: Timestamp;
};

type UserPath = `users/${string}`;

export type Organizations = {
  ownedBy: UserPath;
  name: string;
  members?: UserPath[];
  createdAt: Timestamp;
};

export type Tweet =
  | {
      content: string;
      retweets?: number;
      like?: number;
      type: "plain-text";
    }
  | {
      imageURLs: string[];
      type: "photo";
    }
  | {
      audioURL: string;
      type: "audio";
    };

export type Payment = {
  cardNumber?: string | null;
  expireAt?: Timestamp | null;
};
