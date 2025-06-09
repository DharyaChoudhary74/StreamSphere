import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video

  try {
    const likedVideo = await Like.findOne({
      likedBy: req.user._id,
      video: videoId,
    });

    if (likedVideo) {
      const removedLike = await Like.findByIdAndDelete(likedVideo._id);

      if (!removedLike) {
        throw new ApiError(
          500,
          null,
          "Something went wrong while removing like"
        );
      }
      return res
        .status(201)
        .json(new ApiResponse(201, removedLike, "Video Unliked successfully"));
    }

    const insertedLike = await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });

    if (!insertedLike) {
      throw new ApiError(
        500,
        null,
        "Something went wrong while inserting like"
      );
    }
    return res
      .status(201)
      .json(new ApiResponse(201, insertedLike, "Video liked successfully"));
  } catch (error) {
    throw new ApiError(500, null, "Something went wrong while like");
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment

  try {
    const likedComment = await Like.findOne({
      likedBy: req.user._id,
      comment: commentId,
    });

    if (likedComment) {
      const removedLike = await Like.findByIdAndDelete(likedComment._id);

      if (!removedLike) {
        throw new ApiError(
          500,
          null,
          "Something went wrong while removing like"
        );
      }
      return res
        .status(201)
        .json(
          new ApiResponse(201, removedLike, "Comment Unliked successfully")
        );
    }

    const insertedLike = await Like.create({
      comment: commentId,
      likedBy: req.user._id,
    });

    if (!insertedLike) {
      throw new ApiError(
        500,
        null,
        "Something went wrong while inserting like"
      );
    }
    return res
      .status(201)
      .json(new ApiResponse(201, insertedLike, "Comment liked successfully"));
  } catch (error) {
    throw new ApiError(500, null, "Something went wrong while like");
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet

  try {
    const likedTweet = await Like.findOne({
      likedBy: req.user._id,
      tweet: tweetId,
    });

    if (likedTweet) {
      const removedLike = await Like.findByIdAndDelete(likedTweet._id);

      if (!removedLike) {
        throw new ApiError(
          500,
          null,
          "Something went wrong while removing like"
        );
      }
      return res
        .status(201)
        .json(new ApiResponse(201, removedLike, "Tweet Unliked successfully"));
    }

    const insertedLike = await Like.create({
      tweet: tweetId,
      likedBy: req.user._id,
    });

    if (!insertedLike) {
      throw new ApiError(
        500,
        null,
        "Something went wrong while inserting like"
      );
    }
    return res
      .status(201)
      .json(new ApiResponse(201, insertedLike, "Tweet liked successfully"));
  } catch (error) {
    throw new ApiError(500, null, "Something went wrong while like");
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query;
  const sortOrder = sortType === "desc" ? -1 : 1;

  // Pagination
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    customLabels: {
      totalDocs: "totalVideos",
      docs: "Videos",
    },
  };

  try {
    // Fetch videos using the aggregation pipeline and paginate
    const result = await Like.aggregatePaginate(
      Like.aggregate([
        {
          $match: {
            likedBy: new mongoose.Types.ObjectId(req.user?._id),// it is not passed directly ensuring it is a valid ObjectId
            video: { $exists: true }, // Ensure we are only fetching video likes
          },
        },
        {
          $lookup: {
            from: "videos",
            localField: "video",
            foreignField: "_id",
            as: "video",
            pipeline: [
              {
                $lookup: {
                  from: "users",
                  localField: "owner",
                  foreignField: "_id",
                  as: "owner",
                  pipeline: [
                    {
                      $project: {
                        fullName: 1,
                        username: 1,
                        avatar: 1,
                      },
                    },
                  ],
                },
              },
              {
                $addFields: {
                  owner: {
                    $first: "$owner",// Ensure owner is an object, not an array
                  },
                },
              },
            ],
          },
        },
        {
          $unwind: "$video",
        },
        {
          $sort: { [sortBy]: sortOrder },
        },
      ]),
      options
    );

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Liked Videos fetched successfully"));
  } catch (err) {
    throw new ApiError(
      500,
      "Something went wrong while fetching Liked Videos!!" + err.message
    );
  }
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };