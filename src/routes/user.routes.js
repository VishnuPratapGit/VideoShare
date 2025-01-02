import { Router } from "express";
import { uploadMulter } from "../middlewares/multer.middleware.js";
import verifyJWT from "../middlewares/auth.middleware.js";
import {
    loginUser,
    registerUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserDetails,
    updateAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getHistory,
} from "../controllers/user.controller.js";

const userRouter = Router();

userRouter.route("/register").post(
    uploadMulter.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
    ]),
    registerUser
);
userRouter.route("/login").post(loginUser);
userRouter.route("/logout").post(verifyJWT, logoutUser);
userRouter.route("/refresh-token").post(refreshAccessToken);
userRouter.route("/change-password").post(verifyJWT, changeCurrentPassword);
userRouter.route("/getuser").get(verifyJWT, getCurrentUser);
userRouter.route("/update-details").patch(verifyJWT, updateUserDetails);
userRouter
    .route("/update-avatar")
    .patch(verifyJWT, uploadMulter.single("avatar"), updateAvatar);

userRouter
    .route("/update-coverimage")
    .patch(verifyJWT, uploadMulter.single("coverImage"), updateCoverImage);
userRouter.route("/channel/:username").get(verifyJWT, getUserChannelProfile);
userRouter.route("/history").get(verifyJWT, getHistory);

export default userRouter;
