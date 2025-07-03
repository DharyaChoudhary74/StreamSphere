import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";


const generatAccessAndRefereshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    }
    catch (err) {
        throw new ApiError(500, "Error generating tokens")
    }
}



const registerUser = asyncHandler(async (req, res, next) => {
    //get user details
    //validate -not empty
    //check if user already exists :username,email
    //check ofr images , check for avatar and cover image
    //upload of cloudinary ,avatar
    //crate user object - create entry in db
    //remove password and token feild from response
    //check for user creation
    //return response
    const { fullName, email, username, password } = req.body
    console.log(fullName, email, username, password)
    if (
        [fullName, email, username, password].some((feild) =>
            feild?.trim() === "")
    ) {
        throw new ApiError(400, "All feilds are required")
    }
    if (await User.findOne({ $or: [{ email }, { username }] })) {
        throw new ApiError(409, "User already exists")
    }
    const avtarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files?.coverImage[0]?.path
    }
    if (!avtarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }
    const avtar = await uploadToCloudinary(avtarLocalPath)
    const coverImage = await uploadToCloudinary(coverImageLocalPath)
    if (!avtar) {
        throw new ApiError(500, "Error uploading avatar")
    }
    const user = await User.create({
        fullName,
        email,
        username,
        password,
        avatar: avtar.url,
        coverImage: coverImage?.url || ""
    })
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    if (!createdUser) {
        throw new ApiError(500, "Error creating user")
    }
    return res.status(201).json(
        new ApiResponse(201, createdUser, "user registered successfully")
    )
})

const loginUser = asyncHandler(async (req, res, next) => {
    //req body for data;
    //username or email
    //find the user
    //check password
    //generate access and refresh token
    //send cookies
    const { email, username, password } = req.body;
    if (!email && !username) {
        throw new ApiError(400, "email or username is required")
    }
    if (!password) {
        throw new ApiError(400, "password is required")
    }
    const user = await User.findOne({ $or: [{ email }, { username }] })
    //check if user exists
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    //check password
    if (!await user.isPasswordCorrect(password)) {
        throw new ApiError(401, "Invalid credentials")
    }
    //generate tokens
    const { accessToken, refreshToken } = await generatAccessAndRefereshToken(user._id)

    //remove password and refresh token
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    //send cookies //httpOnly,secure are used so tha cookies can be modifies by an server only
    const options = {
        httpOnly: true,
        secure: true,
    }
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        )
})

const logoutUser = asyncHandler(async (req, res, next) => {
    //clear cookies
    const user = await User.findByIdAndUpdate(req.user._id, {
        $unset: {
            refreshToken: 1
        }
    },
        {
            new: true
        }
    )
    // const user = await User.findById(req.user._id)
    // user.refreshToken = undefined
    // await user.save({validateBeforeSave: false})
    console.log(user);
    const options = {
        httpOnly: true,
        secure: true,
    }
    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "User logged out successfully")
        )
})

const refreshAcessToken = asyncHandler(async (req, res, next) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token not found")
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if (!user) {
            throw new ApiError(404, "User not found")
        }
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is used or expired")
        }
        const { accessToken, newRefreshToken } = await generatAccessAndRefereshToken(user._id)
        const options = {
            httpOnly: true,
            secure: true,
        }
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        user,
                        accessToken,
                        newRefreshToken
                    },
                    "Access token refreshed successfully"
                )
            )
    } catch (error) {
        throw new ApiError(401, "Unauthorized request")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body
    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "All feilds are required")
    }
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid old password")
    }
    user.password = newPassword
    await user.save({ validateBeforeSave: false })
    return res.status(200).json(
        new ApiResponse(200, {}, "Password changed successfully")
    )
})

const getCurrentUser = asyncHandler(async (req, res, next) => {
    return res
        .status(200)
        .json(200, req.user, "Current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async (req, res, next) => {
    const { fullName, email } = req.body
    if (!fullName || !email) {
        throw new ApiError(400, "All feilds are required")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken")
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    return res.status(200).json(
        new ApiResponse(200, user, "User updated successfully")
    )
})

const updateUserAvatar = asyncHandler(async (req, res, next) => {
    const avatarLocalPath = req.files?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }
    const avatar = await uploadToCloudinary(avatarLocalPath)
    if (!avatar.url) {
        throw new ApiError(500, "Error uploading avatar")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken")
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    return res.status(200).json(
        new ApiResponse(200, user, "Avatar updated successfully")
    )
})

const updateUsercoverImage = asyncHandler(async (req, res, next) => {
    const coverImageLocalPath = req.files?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "coverImage is required")
    }
    const coverImage = await uploadToCloudinary(coverImageLocalPath)
    if (!coverImage.url) {
        throw new ApiError(500, "Error uploading coverImage")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken")
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    return res.status(200).json(
        new ApiResponse(200, user, "coverImage updated successfully")
    )
})

const getUserChannelProfile = asyncHandler(async (req, res, next) => {
    const { username } = req.params
    if (!username?.trim()) {
        throw new ApiError(400, "Username is required")
    }
    const channel = await User.aggregate([
        {
            $match: {
                username: username
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $aaddFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$subscribedTo.subscriber"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
            }
        }
    ])
    if (!channel?.length) {
        throw new ApiError(404, "Channel not found")
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "Channel profile fetched successfully")
        )
})

const getWatchHistory = asyncHandler(async (req, res, next) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
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
                                        avatar: 1
                                    }
                                }
                            ]
                        },
                    },
                    {
                        $aaddFields: {
                            owner: {
                                // $arrayElemAt: ["$owner", 0]
                                $first: "$owner"
                            }
                        }
                    }
                ],
            },
        }
    ])
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0].watchHistory,
                "Watch history fetched successfully"
            )
        )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAcessToken,
    getCurrentUser,
    updateAccountDetails,
    changeCurrentPassword,
    updateUsercoverImage,
    updateUserAvatar,
    getUserChannelProfile,
    getWatchHistory
};