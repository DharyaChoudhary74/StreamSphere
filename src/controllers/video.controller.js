import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../utils/cloudinary.js";

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  const userId = req.user._id;

  if ([title, description].some((field) => field.trim === "")) {
    throw new ApiError(400, "field is required");
  }

  const videoFilelocal = req.files?.videoFile[0]?.path;
  const thumbnailLocal = req.files?.thumbnail[0]?.path;

  if (!videoFilelocal) {
    throw new ApiError(400, "Video file is required");
  }
  if (!thumbnailLocal) {
    throw new ApiError(400, "Thumbnail is required");
  }

  const videoFileupload = await uploadToCloudinary(videoFilelocal);
  const thumbnailupload = await uploadToCloudinary(thumbnailLocal);

  if (!videoFileupload) {
    throw new ApiError(500, "Something went wrong while uploading video");
  }
  if (!thumbnailupload) {
    throw new ApiError(500, "Something went wrong while uploading thumbnail");
  }

  try {
    const video = await Video.create({
      videoFile: videoFileupload.url,
      thumbnail: thumbnailupload.url,
      title,
      description,
      owner: userId,
      duration: videoFileupload.duration,
    });

    const existedVideo = await Video.findById(video._id);

    if (!existedVideo) {
      throw new ApiError(500, "Something went wrong while uploading video");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(400, existedVideo, "Video uploaded successfully!!")
      );
  } catch (error) {
    console.log("error", error || "Unauthorized user");
    throw new ApiError(500, "Something went wrong while uploading video");
  }
});

const updateVideoDetails = asyncHandler(async (req, res) => {
  //TODO: update video details like title, description, thumbnail
  const { title, description } = req.body;
  const { videoId } = req.params;

  const existedVideo = await Video.findById(videoId);
  if (!existedVideo) {
    throw new ApiError(400, "Video does not exist");
  }

  if (existedVideo.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this video");
  }

  const thumbnailLocalPath = req.file?.path;
  let thumbnail;

  if (thumbnailLocalPath) {
    thumbnail = await uploadToCloudinary(thumbnailLocalPath);

    if (!thumbnail.url) {
      throw new ApiError(500, "Something went wrong while uploading thumbnail");
    }
    await deleteFromCloudinary(thumbnailLocalPath);
  }

  try {
    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      {
        $set: {
          title: title && title.trim() !== "" ? title : existedVideo.title,
          description:
            description && description.trim() !== ""
              ? description
              : existedVideo.description,
          thumbnail: thumbnailLocalPath
            ? thumbnail.url
            : existedVideo.thumbnail,
        },
      },
      { new: true }
    );

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedVideo, "Video details updated successfully")
      );
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while updating Video details"
    );
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  //TODO: delete video
  const { videoId } = req.params;
  const existedVideo = await Video.findById(videoId);

  if (!existedVideo) {
    throw new ApiError(400, "Video does not exist");
  }
  if (existedVideo.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to Delete this video");
  }

  const result = await Video.deleteOne({ _id: videoId });

  if (!result) {
    throw new ApiError(500, "Something went wrong while deleting a video");
  }

  await deleteFromCloudinary(existedVideo.videoFile);
  await deleteFromCloudinary(existedVideo.thumbnail);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Video deleted successfully"));
});

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;
  const sortOrder = sortType === "desc" ? -1 : 1;

  let aggregationPipeline = [];

  // Filtering
  if (query) {
    aggregationPipeline.push({
      $match: {
        title: { $regex: query, $options: "i" },
      },
    });
  }

  if (userId) {
    aggregationPipeline.push({
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
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

  // Lookup likes count
  aggregationPipeline.push({
    $lookup: {
      from: "likes",
      localField: "_id",
      foreignField: "video",
      as: "likes",
    },
  });

  // Lookup comments count
  aggregationPipeline.push({
    $lookup: {
      from: "comments",
      localField: "_id",
      foreignField: "video",
      as: "comments",
    },
  });

  // Project the required fields
  aggregationPipeline.push({
    $project: {
      videoFile: 1,
      thumbnail: 1,
      title: 1,
      description: 1,
      duration: 1,
      views: 1,
      isPublished: 1,
      owner: {
        _id: "$ownerDetails._id",
        username: "$ownerDetails.username",
        fullName: "$ownerDetails.fullName",
        avatar: "$ownerDetails.avatar",
      },
      likesCount: { $size: "$likes" },
      commentsCount: { $size: "$comments" },
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
      totalDocs: "totalVideos",
      docs: "videos",
    },
  };

  try {
    // Fetch videos using the aggregation pipeline and paginate
    const result = await Video.aggregatePaginate(
      Video.aggregate(aggregationPipeline),
      options
    );

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Videos fetched successfully"));
  } catch (err) {
    throw new ApiError(
      500,
      "Something went wrong while fetching videos!!" + err.message
    );
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  //TODO: get video by id
  const { videoId } = req.params;
  const existedVideo = await Video.findById(videoId);

  if (!existedVideo) {
    throw new ApiError(400, "Video does not exist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, existedVideo, "video fetched successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const existedVideo = await Video.findById(videoId);
  if (!existedVideo) {
    throw new ApiError(400, "Video does not exist");
  }

  if (existedVideo.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to toggle the publish status"
    );
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !existedVideo.isPublished,
      },
    },
    { new: true }
  );

  if (!video) {
    throw new ApiError(500, "Something went wrong while updating a video");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, video, "Video publish status toggled successfully")
    );
});

export {
  publishAVideo,
  updateVideoDetails,
  deleteVideo,
  getAllVideos,
  getVideoById,
  togglePublishStatus,
};