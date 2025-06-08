import { Router } from "express";
import {
    loginUser,
    logoutUser,
    registerUser ,
    refreshAcessToken, 
    getCurrentUser,
    updateAccountDetails,
    changeCurrentPassword,
    updateUsercoverImage,
    updateUserAvatar,
    getUserChannelProfile,
    getWatchHistory
} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        }
    ]),
    registerUser
)
router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(
    verifyJWT,
    logoutUser)
router.route("/refresh-token").post(
refreshAcessToken
)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)

router.route("/curent-user").get(
    verifyJWT,
    getCurrentUser
)

router.route("/update-account").patch(
    verifyJWT,
    updateAccountDetails
)
router.route("/update-cover-image").patch(
    verifyJWT,
    upload.single("coverImage"),
    updateUsercoverImage
)
router.route("/update-avatar").patch(
    verifyJWT,
    upload.single("avatar"),
    updateUserAvatar
)
router.route("/c/:username").get(
    verifyJWT,
    getUserChannelProfile
)
router.route("/watch-history").get(
    verifyJWT,
    getWatchHistory
)
export default router;