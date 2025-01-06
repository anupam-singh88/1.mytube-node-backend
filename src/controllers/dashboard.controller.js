import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import ApiResponse from "../utils/ApiResposne.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

// Get channel stats
const getChannelStats = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.user?._id;

        const totalSubscribers = await Subscription.aggregate([
            {
                $match: {
                    channel: new mongoose.Types.ObjectId(userId),
                },
            },
            {
                $group: {
                    _id: null,
                    subscribersCount: { $sum: 1 },
                },
            },
        ]);

        const videoStats = await Video.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId),
                },
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "likes",
                },
            },
            {
                $project: {
                    totalLikes: { $size: "$likes" },
                    totalViews: "$views",
                    totalVideos: 1,
                },
            },
            {
                $group: {
                    _id: null,
                    totalLikes: { $sum: "$totalLikes" },
                    totalViews: { $sum: "$totalViews" },
                    totalVideos: { $sum: 1 },
                },
            },
        ]);

        const channelStats = {
            totalSubscribers: totalSubscribers[0]?.subscribersCount || 0,
            totalLikes: videoStats[0]?.totalLikes || 0,
            totalViews: videoStats[0]?.totalViews || 0,
            totalVideos: videoStats[0]?.totalVideos || 0,
        };

        return res
            .status(200)
            .json(
                new ApiResponse({
                    statusCode: 200,
                    data: channelStats,
                    message: "Channel stats fetched successfully.",
                })
            );
    } catch (error) {
        return next(
            new ApiError({
                statusCode: 500,
                errors: { message: "Failed to fetch channel stats.", message: error.message },
            })
        );
    }
});

// Get channel videos
const getChannelVideos = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.user?._id;

        const videos = await Video.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(userId),
                },
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "likes",
                },
            },
            {
                $addFields: {
                    createdAt: { $dateToParts: { date: "$createdAt" } },
                    likesCount: { $size: "$likes" },
                },
            },
            {
                $sort: {
                    createdAt: -1,
                },
            },
            {
                $project: {
                    _id: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    title: 1,
                    description: 1,
                    createdAt: {
                        year: 1,
                        month: 1,
                        day: 1,
                    },
                    isPublished: 1,
                    likesCount: 1,
                },
            },
        ]);

        return res
            .status(200)
            .json(
                new ApiResponse({
                    statusCode: 200,
                    data: videos,
                    message: "Channel videos fetched successfully.",
                })
            );
    } catch (error) {
        return next(
            new ApiError({
                statusCode: 500,
                errors: { message: "Failed to fetch channel videos.", message: error.message },
            })
        );
    }
});

export { getChannelStats, getChannelVideos };
