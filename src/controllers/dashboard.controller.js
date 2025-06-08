import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  try {
    const videoStats = await Video.aggregate([
      {
        $match: {
          owner: req.user?._id,
        },
      },
      {
        $lookup: {
          from: "likes",
          foreignField: "video",
          localField: "_id",
          as: "likes",
        },
      },
      {
        $project: {
          likesCount: {
            $size: "$likes",
          },

          viewsCount: {
            $size: "$views",
            totalVideos: 1,
          },
        },
      },

      {
        $group: {
          _id: null,
          totalLikesCount: {
            $sum: "$likesCount",
          },
          totalViewsCount: {
            $sum: "$viewsCount",
          },
          totalVideos: {
            $sum: 1,
          },
        },
      },
    ]);

    const subscriberStats = await Subscription.aggregate([
      {
        $match: {
          channel: req.user?._id,
        },
      },
      {
        $group: {
          _id: null,
          subscriberCount: {
            $sum: 1,
          },
        },
      },
    ]);

    if (!(videoStats || subscriberStats)) {
      throw new ApiError(500, "Failed to fetch channel data");
    }

    const stats = {
      subscriberCount: subscriberStats[0]?.subscriberCnt || 0,
      totalLikes: videoStats[0]?.totalLikesCnt || 0,
      totalVideos: videoStats[0]?.totalVideos || 0,
      totalViews: videoStats[0]?.totalViewsCnt || 0,
    };

    return res
      .status(200)
      .json(new ApiResponse(200, stats, "Channel stats fetched successfully"));
  } catch (error) {
    throw new ApiError(500, "Something went wrong while fetching channel data");
  }
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel

  try {
    const videos = await Video.aggregate([
      {
        $match: {
          owner: req.user?._id,
        },
      },

      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "video",
          as: "likes",
        },
      },

      {
        $addFields: {
          likesCount: {
            $size: "$likes",
          },
        },
      },

      {
        $project: {
          _id: 1,
          videoFile: 1,
          thumbnail: 1,
          title: 1,
          description: 1,
          duration: 1,
          createdAt: 1,
          owner: 1,
          views: 1,
          likesCount: 1,
          isPublished: 1,
          videoFile_public_id: 1,
          thumbnail_public_id: 1,
        },
      },
    ]);

    if (!videos || videos.length === 0) {
      throw new ApiError(404, "No videos found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, videos, "Videos fetched successfully"));
  } catch (error) {
    throw new ApiError(404, "Something went wrong while fetching videos");
  }
});

export { getChannelStats, getChannelVideos };