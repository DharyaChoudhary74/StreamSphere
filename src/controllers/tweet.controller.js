import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;

  if (!content || content.trim() === "") {
    throw new ApiError(401, "Content is required!!");
  }

  try {
    const createdTweet = await Tweet.create({
      content,
      owner: req.user._id,
    });

    if (!createTweet) {
      throw new ApiError(500, "Something went wrong while creating tweet");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, createdTweet, "Successfully created tweet"));
  } catch (error) {
    throw new ApiError(500, "Something went wrong while creating tweet");
  }
});

const getAllTweets = asyncHandler(async (req, res) => {
  //TODO: get all tweets
  const {
    page = 1,
    limit = 10,
    query,
    userId,
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query;
  const sortOrder = sortType === "desc" ? -1 : 1;
  let aggregationPipeline = [];

  if (userId) {
    aggregationPipeline.push({
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    });
  }

  // Filtering
  if (query) {
    aggregationPipeline.push({
      $match: {
        content: { $regex: query, $options: "i" },
      },
    });
  }

  // Lookup owner details
  aggregationPipeline.push({
    $lookup: {
      from: "users",
      localField: "owner",
      foreignField: "_id",
      as: "ownerDetails",
    },
  });

  // Unwind the ownerDetails array
  aggregationPipeline.push({
    $unwind: "$ownerDetails",
  });

  // Project the required fields
  aggregationPipeline.push({
    $project: {
      content: 1,
      owner: {
        _id: "$ownerDetails._id",
        username: "$ownerDetails.username",
        fullName: "$ownerDetails.fullName",
        avatar: "$ownerDetails.avatar",
      },
      createdAt: 1,
      updatedAt: 1,
    },
  });

  // Sorting
  aggregationPipeline.push({
    $sort: { [sortBy]: sortOrder },
  });

  // Pagination
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    customLabels: {
      totalDocs: "totalTweets",
      docs: "tweets",
    },
  };

  try {
    // Fetch videos using the aggregation pipeline and paginate
    const result = await Tweet.aggregatePaginate(
      Tweet.aggregate(aggregationPipeline),
      options
    );

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Tweets fetched successfully"));
  } catch (err) {
    throw new ApiError(
      500,
      "Something went wrong while fetching Tweet!!" + err.message
    );
  }
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { content } = req.body;
  const { tweetId } = req.params;

  if (!content || content.trim() === "") {
    throw new ApiError(401, "Content is required!!");
  }

  try {
    const existingTweet = await Tweet.findById(tweetId);

    if (!existingTweet) {
      throw new ApiError(403, "Tweet does not exist");
    }

    if (existingTweet.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You are not authorized to update this tweet");
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
      tweetId,
      {
        $set: {
          content,
        },
      },
      { new: true }
    );

    if (!updateTweet) {
      throw new ApiError(500, "Something went wrong while updating tweet");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updatedTweet, "Successfully updated tweets"));
  } catch (error) {
    throw new ApiError(500, "Something went wrong while updating tweet");
  }
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;

  try {
    const existingTweet = await Tweet.findById(tweetId);

    if (!existingTweet) {
      throw new ApiError(403, "Tweet does not exist");
    }

    if (existingTweet.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You are not authorized to delete this tweet");
    }

    const response = await Tweet.findByIdAndDelete(tweetId);

    if (!updateTweet) {
      throw new ApiError(500, "Something went wrong while deleting tweet");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, response, "Successfully deleted tweets"));
  } catch (error) {
    throw new ApiError(500, "Something went wrong while updating tweet");
  }
});

export { createTweet, getAllTweets, updateTweet, deleteTweet };