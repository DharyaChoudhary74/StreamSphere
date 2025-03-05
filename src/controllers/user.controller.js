import { asyncHandler } from "../utils/asyncHandler.js";
import {apiError} from "../utils/apiError.js";
import {User} from "../models/user.model.js";
import {uploadToCloudinary} from "../utils/cloudinary.js";
import {apiResponse} from "../utils/apiResponse.js";

const registerUser  =asyncHandler(async (req, res, next) => {
    //get user details
    //validate -not empty
    //check if user already exists :username,email
    //check ofr images , check for avatar and cover image
    //upload of cloudinary ,avatar
    //crate user object - create entry in db
    //remove password and token feild from response
    //check for user creation
    //return response
    const {fullName , email , username ,password} = req.body
    console.log(fullName , email , username ,password)
    if(
        [fullName , email , username ,password].some((feild) =>
            feild?.trim() === "")
    )
    {
        throw new apiError(400,"All feilds are required")
    }
    if(await User.findOne({$or : [{email},{username}]}) )
    {
        throw new apiError(409,"User already exists")
    }
    const avtarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0)
    {
        coverImageLocalPath = req.files?.coverImage[0]?.path
    }
    if(!avtarLocalPath)
    {
        throw new apiError(400,"Avatar is required")
    }
    const avtar = await uploadToCloudinary(avtarLocalPath)
    const coverImage = await uploadToCloudinary(coverImageLocalPath)
    if(!avtar)
    {
        throw new apiError(500,"Error uploading avatar")
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
    if(!createdUser)
    {
        throw new apiError(500,"Error creating user")
    }
    return res.status(201).json(
        new apiResponse(201,createdUser,"user registered successfully")
    )
})

export {registerUser};