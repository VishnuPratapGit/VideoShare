import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, fullName } = req.body;

    if (
        [username, email, password, fullName].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const checkDuplicate = await User.findOne({
        $or: [{ username }, { email }],
    });
    if (checkDuplicate) throw new ApiError(409, "User already exists");

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if (!avatarLocalPath) throw new ApiError(400, "Avatar is required");

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar) throw new ApiError(400, "Avatar not upload!");

    const user = await User.create({
        username: username.toLowerCase(),
        fullName,
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    });

    const userResponce = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    if (!userResponce) throw new ApiError(400, "Avatar not upload!");

    return res
        .status(201)
        .json(
            new ApiResponse(201, "User Register Successfully.", userResponce)
        );
});

export { registerUser };
