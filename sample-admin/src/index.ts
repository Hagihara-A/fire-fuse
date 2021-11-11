import * as functions from "firebase-functions";
import { DB } from "./fuse.js";

export const userInfo = functions.https.onRequest(async (req, res) => {
  const uid = req.params.uid;
  const user = await DB.doc(`users/${uid}`).get();
  const textTweets = await DB.collection(`users/${uid}/tweets`)
    .where("type", "==", "plain-text" as const)
    .get();
  const recentTweets = textTweets.docs
    .map((tw) => tw.data().content) // imageURLs, audioURL doesn't exist anymore
    .slice(0, 3);
  const data = user.data();
  if (typeof data === "undefined") {
    res.send(`user not exists`);
    return;
  }

  res.send(`userName: ${data.name}
following: ${data.relation?.follow?.join(", ") ?? "None"}
followedBy: ${data.relation?.follower?.join(", ") ?? "None"}
createdAt: ${data.createdAt.toDate().toUTCString()}
recentTweets: ${recentTweets.join(", ")}`);
  return;
});
