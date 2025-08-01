import { Router } from "express";
import {
  createTweet,
  deleteTweet,
  getAllTweets,
  updateTweet,
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(createTweet).get(getAllTweets);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router;