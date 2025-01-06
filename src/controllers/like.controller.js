import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import ApiResponse from "../utils/ApiResposne.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError({ statusCode: 400, message: "Invalid videoId" });
    }

    const likedAlready = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id,
    });

    if (likedAlready) {
        await Like.findByIdAndDelete(likedAlready?._id);

        return res.status(200).json(
            new ApiResponse({
                statusCode: 200,
                data: { isLiked: false },
                message: "Like removed successfully",
            })
        );
    }

    await Like.create({
        video: videoId,
        likedBy: req.user?._id,
    });

    return res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            data: { isLiked: true },
            message: "Video liked successfully",
        })
    );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError({ statusCode: 400, message: "Invalid commentId" });
    }

    const likedAlready = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id,
    });

    if (likedAlready) {
        await Like.findByIdAndDelete(likedAlready?._id);

        return res.status(200).json(
            new ApiResponse({
                statusCode: 200,
                data: { isLiked: false },
                message: "Like removed successfully",
            })
        );
    }

    await Like.create({
        comment: commentId,
        likedBy: req.user?._id,
    });

    return res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            data: { isLiked: true },
            message: "Comment liked successfully",
        })
    );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError({ statusCode: 400, message: "Invalid tweetId" });
    }

    const likedAlready = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id,
    });

    if (likedAlready) {
        await Like.findByIdAndDelete(likedAlready?._id);

        return res.status(200).json(
            new ApiResponse({
                statusCode: 200,
                data: { tweetId, isLiked: false },
                message: "Like removed successfully",
            })
        );
    }

    await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id,
    });

    return res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            data: { isLiked: true },
            message: "Tweet liked successfully",
        })
    );
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideosAggregate = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideo",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails",
                        },
                    },
                    {
                        $unwind: "$ownerDetails",
                    },
                ],
            },
        },
        {
            $unwind: "$likedVideo",
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
        {
            $project: {
                _id: 0,
                likedVideo: {
                    _id: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    owner: 1,
                    title: 1,
                    description: 1,
                    views: 1,
                    duration: 1,
                    createdAt: 1,
                    isPublished: 1,
                    ownerDetails: {
                        username: 1,
                        fullName: 1,
                        "avatar.url": 1,
                    },
                },
            },
        },
    ]);

    return res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            data: likedVideosAggregate,
            message: "Liked videos fetched successfully",
        })
    );
});

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos };
