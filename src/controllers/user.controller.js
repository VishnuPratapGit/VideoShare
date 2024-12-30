import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

const generateTokens = async (user) => {
    try {
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Error in token generation.");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, fullName } = req.body;

    // check if any field is empty
    if (
        [username, email, password, fullName].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // check if user already register or not
    const checkDuplicate = await User.findOne({
        $or: [{ username }, { email }],
    });
    if (checkDuplicate) throw new ApiError(409, "User already exists");

    // Handle avatar upload
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    if (!avatarLocalPath) throw new ApiError(400, "Avatar is required");

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar?.url) throw new ApiError(400, "Avatar upload failed!");

    // Handle coverImage upload
    let coverImage = null;
    if (req.files?.coverImage?.[0]?.path) {
        const coverImageLocalPath = req.files.coverImage[0].path;
        coverImage = await uploadOnCloudinary(coverImageLocalPath);
    }

    // register user
    const user = await User.create({
        username: username.toLowerCase(),
        fullName,
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    });

    // create user responce with removing critical fields.
    const userResponce = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!userResponce) {
        throw new ApiError(400, "User registration unsuccessful!");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(201, "User Register Successfully.", userResponce)
        );
});

const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if ([email, password, username].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields required");
    }

    const user = await User.findOne({ $or: [{ username }, { email }] });

    if (!user) {
        throw new ApiError(404, "User not found!");
    }

    const isUserValid = await user.isPasswordCorrect(password);

    if (!isUserValid) {
        throw new ApiError(401, "Invalid Password!");
    }

    const { accessToken, refreshToken } = await generateTokens(user);

    const responceUserData = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, "User logged in successfully", {
                user: responceUserData,
                accessToken,
                refreshToken,
            })
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        { $set: { refreshToken: undefined } },
        { new: true }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, "\nUser logged out successfully\n", {}));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookie?.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "refresh token not exist || login again");
    }

    const decodedToken = jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?.id);

    if (!user) {
        throw new ApiError(404, "User not found. Please log in again.");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401, "Invalid refresh token.");
    }

    const { accessToken, newRefreshToken } = await generateTokens(user);

    const options = {
        httpOnly: true,
        secure: true,
    };

    res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200, "Access Token Refreshed", {
                accessToken,
                refreshToken: newRefreshToken,
            })
        );
});

// auth middleware required
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword && !newPassword)
        throw new ApiError(401, "Fields are mendatory");

    const user = req.user;

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect)
        throw new ApiError(401, "Incorrect current password!");

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, "Password Changed Successfully"));
});

// auth middleware required
const getCurrentUser = asyncHandler((req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, "User fetched successfully", req.user));
});

// auth middleware required
const updateUserDetails = asyncHandler(async (req, res) => {
    const { newfullName, newEmail, oldPassword, newPassword } = req.body;

    if (!oldPassword) {
        throw new ApiError(401, "Password is required to update details");
    }

    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(500, "Database error occurred!");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Incorrect Password!");
    }

    if (newfullName) user.fullName = newfullName;
    if (newEmail) user.email = newEmail;
    if (newPassword) user.password = newPassword;

    await user.save();

    const updatedUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    return res
        .status(200)
        .json(new ApiResponse(200, "Update Successfully", updatedUser));
});

// both middleware required
const updateAvatar = asyncHandler(async (req, res) => {
    const localAvatarPath = req.file?.avatar;

    if (!localAvatarPath) {
        throw new ApiError(400, "Avatar is missing!");
    }

    const avatar = await uploadOnCloudinary(localAvatarPath);

    if (!avatar.url) {
        throw new ApiError(400, "Error in uploading avatar!");
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { avatar: avatar.url } },
        { new: true }
    ).select("-password -refreshToken");

    res.status(200).json(
        new ApiResponse(200, "Avatar update successfull", updatedUser)
    );
});

// both middleware required
const updateCoverImage = asyncHandler(async (req, res) => {
    const localCoverImagePath = req.file?.coverImage;

    if (!localCoverImagePath) {
        throw new ApiError(400, "CoverImage file is missing!");
    }

    const coverImage = await uploadOnCloudinary(localCoverImagePath);

    if (!coverImage.url) {
        throw new ApiError(400, "Error in uploading coverImage!");
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: { coverImage: coverImage.url } },
        { new: true }
    ).select("-password -refreshToken");

    res.status(200).json(
        new ApiResponse(200, "CoverImage successfully updated", updatedUser)
    );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserDetails,
    updateAvatar,
    updateCoverImage,
};
