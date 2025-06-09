import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription

  try {
    const alreadySubscribed = await Subscription.findOne({
      subscriber: req.user._id,
      channel: channelId,
    });

    if (alreadySubscribed) {
      const deleteSubscription = await Subscription.findByIdAndDelete(
        alreadySubscribed._id
      );

      if (deleteSubscription) {
        return res
          .status(201)
          .json(
            new ApiResponse(
              201,
              deleteSubscription,
              "Channel Unsubscribed successfully"
            )
          );
      }
    }

    const insertsubscription = await Subscription.create({
      subscriber: req.user._id,
      channel: channelId,
    });

    if (!insertsubscription) {
      throw new ApiError(500, null, "Something went wrong while subscribing");
    }

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          insertsubscription,
          "Subscription created successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, error || "Something went wrong while subscribing");
  }
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  try {
    const subscribers = await Subscription.aggregate([
      {
        $match: {
          channel: new mongoose.Types.ObjectId(channelId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "subscriber",
          foreignField: "_id",
          as: "subscriber",
        },
      },
      {
        $unwind: "$subscriber",
      },
      {
        $group: {
          _id: "$channel",
          channel: { $first: "$channel" },
          subscribers: {
            $push: {
              id: "$subscriber._id",
              username: "$subscriber.username",
              fullName: "$subscriber.fullName",
              avatar: "$subscriber.avatar",
            },
          },
          totalCount: { $sum: 1 }, // Count the number of subscribers
        },
      },
    ]);

    if (!subscribers) {
      throw new ApiError(401, error || "subscribers doest not exist!!");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          subscribers.length > 0 ? subscribers[0] : {},
          "Successfully fetched subscriber list"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      error || "Something went wrong while fetching the subscriber list"
    );
  }
});

// const getUserChannelSubscribers = asyncHandler(async (req, res) => {
//   const { channelId } = req.params;

//   try {
//     // Find all subscriptions for the given channelId
//     const subscriptions = await Subscription.find({ channel: channelId })
//       .populate("subscriber", "username fullName avatar") // Populate the subscriber details
//       .exec();

//     if (!subscriptions) {
//       throw new ApiError(404,"No subscribers found for this channel")
//     }

//     const channel = subscriptions[0].channel;
//     const subscribers = subscriptions.map((sub) => ({
//       id: sub.subscriber._id,
//       username: sub.subscriber.username,
//       fullName: sub.subscriber.fullName,
//       avatar: sub.subscriber.avatar,
//     }));

//     const totalCount = subscribers.length;

//     return res
//       .status(200)
//       .json(
//         new ApiResponse(
//           200,
//           { channel, subscribers, totalCount },
//           "Successfully fetched subscriber list"
//         )
//     );

//   } catch (error) {
//     throw new ApiError(500, "Something went wrong while fetching the subscriber list" )
//   }
// });

// const getUserChannelSubscribers = asyncHandler(async (req, res) => {
//   const { channelId } = req.params;

//   try {
//     const subscriberList = await Subscription.aggregate([
//       {
//         $match: {
//           channel: new mongoose.Types.ObjectId(channelId),
//         },
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "subscriber",
//           foreignField: "_id",
//           as: "subscriber",
//         },
//       },
//       {
//         $unwind: "$subscriber",
//       },
//       {
//         $project: {
//           channel: 1, // Keep the channel field
//           id: "$subscriber._id",
//           username: "$subscriber.username",
//           fullName: "$subscriber.fullName",
//           avatar: "$subscriber.avatar",
//         },
//       },
//     ]);

//     const totalCount = subscriberList.length;

//     // Extract the channel field from the first document (all documents have the same channel)
//     const channel =
//       subscriberList.length > 0 ? subscriberList[0].channel : channelId;

//     // Remove the channel field from each subscriber object
//     const formattedSubscribers = subscriberList.map((subscriber) => ({
//       id: subscriber.id,
//       username: subscriber.username,
//       fullName: subscriber.fullName,
//       avatar: subscriber.avatar,
//     }));

//     return res
//       .status(200)
//       .json(
//         new ApiResponse(
//           200,
//           { channel, subscribers: formattedSubscribers, totalCount },
//           "Successfully fetched subscriber list"
//         )
//       );
//   } catch (error) {
//     console.error("Error fetching subscriber list", error);
//     throw new ApiError(
//       500,
//       "Something went wrong while fetching the subscriber list"
//     );
//   }
// });

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  // TODO: get subscribed channels

  try {
    const subscribedChannels = await Subscription.aggregate([
      {
        $match: {
          subscriber: new mongoose.Types.ObjectId(subscriberId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "channel",
          foreignField: "_id",
          as: "channel",
        },
      },
      {
        $unwind: "$channel",
      },
      {
        $group: {
          _id: "$subscriber",
          subscriber: { $first: "$subscriber" }, // Preserve the channel ID
          channels: {
            $push: {
              id: "$channel._id",
              username: "$channel.username",
              fullName: "$channel.fullName",
              avatar: "$channel.avatar",
            },
          },
          totalCount: { $sum: 1 }, // Count the number of subscribers
        },
      },
    ]);

    if (!subscribedChannels) {
      throw new ApiError(401, "subscribers doest not exist!!");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          subscribedChannels.length > 0 ? subscribedChannels[0] : {},
          "Subscribed channels fetched successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      error || "Something went wrong while fetching the subscribed channels"
    );
  }
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };