import mongoose from "mongoose";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";


const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query;
  const sortOrder = sortType === "desc" ? -1 : 1;

  let aggregationPipeline = [];

  if (videoId) {
    aggregationPipeline.push({
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    });
  }

  // Filtering
  if (query) {
    aggregationPipeline.push({
      $match: {
        content: { $regex: query, $options: "i" },//case in sensative search
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
      from: "videos",
      localField: "video",
      foreignField: "_id",
      as: "videoDetail",
    },
  });
  // Unwind the videodetail array
  aggregationPipeline.push({
    $unwind: "$videoDetail",
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
      video: {
        _id: "$videoDetail._id",
        videoFile: "$videoDetail.videoFile",
        thumbnail: "$videoDetail.thumbnail",
        title: "$videoDetail.title",
        description: "$videoDetail.description",
        duration: "$videoDetail.duration",
        views: "$videoDetail.views",
        isPublished: "$videoDetail.isPublished",
      },
      createdAt: 1,
      updatedAt: 1,
    },
  });

  // Sorting
  aggregationPipeline.push({
    $sort: { [sortBy]: sortOrder },//[] use changing the key dynamically
  });

  // Pagination
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    customLabels: {
      totalDocs: "totalComment",
      docs: "comments",
    },
  };

  try {
    // Fetch videos using the aggregation pipeline and paginate
    const result = await Comment.aggregatePaginate(
      Comment.aggregate(aggregationPipeline),
      options
    );

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Comment fetched successfully"));
  } catch (err) {
    throw new ApiError(
      500,
      "Something went wrong while fetching Comment!!" + err.message
    );
  }
});


const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { content } = req.body;
  const { videoId } = req.params;

  if (!content || content.trim() == "") {
    throw new ApiError(400, "Content field is required");
  }

  try {
    const existingVideo = await Video.findById(
      new mongoose.Types.ObjectId(videoId)
    );
    if (!existingVideo) {
      throw new ApiError(400, "Video does not found");
    }

    const comment = await Comment.create({
      content,
      video: videoId,
      owner: req.user._id,
    });

    if (!comment) {
      throw new ApiError(500, "Something went wrong while adding comment");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, comment, "Comment added successfully"));
  } catch (error) {
    throw new ApiError(500, "Something went wrong while adding comment");
  }
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { content } = req.body;
  const { commentId } = req.params;

  if (!content || content.trim() == "") {
    throw new ApiError(400, "Content field is required");
  }

  try {
    const existingComment = await Comment.findById(commentId);

    if (!existingComment) {
      throw new ApiError(400, "Comment does not exist");
    }

    // Check if the user is the owner of the comment
    if (existingComment.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You are not authorized to update this Comment");
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      {
        $set: {
          content,
        },
      },
      { new: true }
    );

    if (!updatedComment) {
      throw ApiError(401, "Something went wrong while updating comment");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedComment, "Successfully updated comment")
      );
  } catch (error) {
    throw ApiError(500, "Something went wrong while updating comment");
  }
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;

  try {
    const existingComment = await Comment.findById(commentId);

    if (!existingComment) {
      throw new ApiError(400, "Comment does not exist");
    }

    // Check if the user is the owner of the comment
    // If the user is not the owner, throw an error
    if (existingComment.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You are not authorized to delete this Comment");
    }

    const comment = await Comment.findByIdAndDelete(commentId);

    if (!comment) {
      throw ApiError(401, "Something went wrong while Deleting comment");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, comment, "Successfully deleted comment"));
  } catch (error) {
    throw ApiError(500, "Something went wrong while deleting comment");
  }
});

export { getVideoComments, addComment, updateComment, deleteComment };