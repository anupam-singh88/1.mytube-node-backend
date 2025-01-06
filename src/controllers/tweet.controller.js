import mongoose, { isValidObjectId } from "mongoose";

import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { Tweet } from "../models/tweet.model.js";
import ApiResponse from "../utils/ApiResposne.js";

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content) {
        throw new ApiError({ statusCode: 400, message: "content is required" });
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user?._id,
    });

    if (!tweet) {
        throw new ApiError({ statusCode: 500, message: "failed to create tweet please try again" });
    }

    return res
        .status(200)
        .json(new ApiResponse({ statusCode: 200, data: tweet, message: "Tweet created successfully" }));
});

const updateTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { tweetId } = req.params;

    if (!content) {
        throw new ApiError({ statusCode: 400, message: "content is required" });
    }

    if (!isValidObjectId(tweetId)) {
        throw new ApiError({ statusCode: 400, message: "Invalid tweetId" });
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError({ statusCode: 404, message: "Tweet not found" });
    }

    if (tweet?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError({ statusCode: 400, message: "only owner can edit thier tweet" });
    }

    const newTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content,
            },
        },
        { new: true }
    );

    if (!newTweet) {
        throw new ApiError({ statusCode: 500, message: "Failed to edit tweet please try again" });
    }

    return res
        .status(200)
        .json(new ApiResponse({ statusCode: 200, data: newTweet, message: "Tweet updated successfully" }));
});

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError({ statusCode: 400, message: "Invalid tweetId" });
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError({ statusCode: 404, message: "Tweet not found" });
    }

    if (tweet?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError({ statusCode: 400, message: "only owner can delete thier tweet" });
    }

    await Tweet.findByIdAndDelete(tweetId);

    return res
        .status(200)
        .json(new ApiResponse({ statusCode: 200, data: { tweetId }, message: "Tweet deleted successfully" }));
});

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError({ statusCode: 400, message: "Invalid userId" });
    }

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            "avatar.url": 1,
                        },
                    },
                ],
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likeDetails",
                pipeline: [
                    {
                        $project: {
                            likedBy: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likeDetails",
                },
                ownerDetails: {
                    $first: "$ownerDetails",
                },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likeDetails.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            },
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                content: 1,
                ownerDetails: 1,
                likesCount: 1,
                createdAt: 1,
                isLiked: 1
            },
        },
    ]);

    return res
        .status(200)
        .json(new ApiResponse({ statusCode: 200, data: tweets, message: "Tweets fetched successfully" }));
});

export { createTweet, updateTweet, deleteTweet, getUserTweets };
