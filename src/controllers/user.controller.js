import { User } from "../models/user.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/ApiResposne.js";
import asyncHandler from "../utils/asyncHandler.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";

export const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError({
                statuscode: 404,
                message: "User not found"
            });
        }

        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError({
            statuscode: 500,
            message: "Failed to generate tokens"
        })
    }
}

export const registerUser = asyncHandler(async (req, res) => {
    const { username, email, fullName, password } = req.body;

    if ([username, email, fullName, password].some(
        (field) => (field?.trim() === "")
    )) {
        throw new ApiError({
            statuscode: 400,
            message: "All fields are required"
        })
    }

    const userExists = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (userExists) {
        throw new ApiError({
            statuscode: 400,
            message: "User already exists"
        });
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;

    if (!avatarLocalPath) throw new ApiError({
        statuscode: 400,
        message: "Avatar is required"
    });

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath).catch((error) => console.log(error))
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

    if (!avatar) {
        throw new ApiError({
            statuscode: 500,
            message: "Failed to upload avatar"
        })
    }

    const user = await User.create({
        fullName,
        avatar: {
            public_id: avatar.public_id,
            url: avatar.secure_url
        },
        coverImage: {
            public_id: coverImage?.public_id || "",
            url: coverImage?.secure_url || ""
        },
        username: username.toLowerCase(),
        email,
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) throw new ApiError({
        statuscode: 500,
        message: "Failed to create user"
    })

    return res.status(201).json(
        new ApiResponse({
            data: createdUser,
            message: "User registered successfully",
            statusCode: "201"
        })
    )
})

export const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if (!email || !username) {
        throw new ApiError({
            statuscode: 400,
            message: "Email or username is required"
        })
    }
    const user = await User.findOne({
        $or: [{ email }, { username }]
    });

    if (!user) {
        throw new ApiError({
            statuscode: 404,
            message: "User not found"
        })
    }

    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
        throw new ApiError({
            statuscode: 401,
            message: "Invalid credentials"
        })
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select(" -password -refreshToken");
    const loggedInUserWithToken = { ...loggedInUser._doc, accessToken, };

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "None"
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                {
                    statusCode: 200,
                    message: "Logged in successfully",
                    data: loggedInUserWithToken
                }
            )
        );
})

export const logoutUser = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $unset: {
                refreshToken: 1 // removes field from document
            }
        },
        { new: true }
    );

    if (!user) {
        throw new ApiError({
            statusCode: 404,
            message: "User not found"
        });
    }


    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "None"
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                {
                    message: "User logged out successfully !!!",
                    statusCode: 200

                }
            )
        );
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError({
            statusCode: 401,
            message: "Refresh token is required"
        });
    }

    const user = await User.findOne({
        refreshToken: incomingRefreshToken
    });

    if (!user) {
        throw new ApiError({ statusCode: 401, message: "Invalid refresh token" });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "None"
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                {
                    statusCode: 200,
                    data: {
                        accessToken,
                        refreshToken
                    },
                    message: "Access token refreshed"
                }
            )
        )

});

export const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError({ statusCode: 404, message: "User not found" });
    }

    const isOldPasswordCorrect = await user.comparePassword(oldPassword);

    if (!isOldPasswordCorrect) {
        throw new ApiError({ statusCode: 400, message: "Incorrect old password" });
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse({ statusCode: 200, message: "Password updated successfully" })
        )
});

export const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse({ statusCode: 200, data: req.user, message: "current user fetched successfully" })
        )
});

export const updateUserDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
        throw new ApiError({ statusCode: 400, message: "All fields are required" });
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        { new: true }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(
            new ApiResponse({ statusCode: 200, data: user, message: "Account details updated successfully" })
        )
});

export const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError({ statusCode: 400, message: "Avatar file is missing" });
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError({ statusCode: 400, message: "Error while uploading avatar" });
    }

    const user = await User.findById(req.user._id).select("avatar");

    const avatarToDelete = user.avatar.public_id;

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: {
                    public_id: avatar.public_id,
                    url: avatar.secure_url
                }
            }
        },
        { new: true }
    ).select("-password");

    if (avatarToDelete && updatedUser.avatar.public_id) {
        await deleteOnCloudinary(avatarToDelete);
    }

    return res
        .status(200)
        .json(
            new ApiResponse({ statusCode: 200, data: updatedUser, message: "Avatar updated successfully" })
        )
});

export const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError({ statusCode: 400, message: "coverImage file is missing" });
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage.url) {
        throw new ApiError({ statusCode: 400, message: "Error while uploading coverImage" });
    }

    const user = await User.findById(req.user._id).select("coverImage");

    const coverImageToDelete = user.coverImage.public_id;

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: {
                    public_id: coverImage.public_id,
                    url: coverImage.secure_url
                }
            }
        },
        { new: true }
    ).select("-password");

    if (coverImageToDelete && updatedUser.coverImage.public_id) {
        await deleteOnCloudinary(coverImageToDelete);
    }

    return res
        .status(200)
        .json(
            new ApiResponse({ statusCode: 200, data: updatedUser, message: "coverImage update successfull" })
        )
});


















