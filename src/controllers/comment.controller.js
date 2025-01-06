import mongoose from "mongoose";
import { Comment } from "../models/comment.models.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.models.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResposne.js"
import asyncHandler from "../utils/asyncHandler.js";

// Get all comments for a video
const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError({ statusCode: 404, message: "Video not found" });
    }

    const commentsAggregate = Comment.aggregate([
        {
            $match: { video: new mongoose.Types.ObjectId(videoId) },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes",
            },
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" },
                owner: { $first: "$owner" },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        { $sort: { createdAt: -1 } },
        {
            $project: {
                content: 1,
                createdAt: 1,
                likesCount: 1,
                owner: {
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1,
                },
                isLiked: 1,
            },
        },
    ]);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const comments = await Comment.aggregatePaginate(commentsAggregate, options);

    return res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            data: comments,
            message: "Comments fetched successfully",
        })
    );
});

// Add a comment to a video
const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;

    if (!content) {
        throw new ApiError({ statusCode: 400, message: "Content is required" });
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError({ statusCode: 404, message: "Video not found" });
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id,
    });

    if (!comment) {
        throw new ApiError({
            statusCode: 500,
            message: "Failed to add comment, please try again",
        });
    }

    return res.status(201).json(
        new ApiResponse({
            statusCode: 201,
            data: comment,
            message: "Comment added successfully",
        })
    );
});

// Update a comment
const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content) {
        throw new ApiError({ statusCode: 400, message: "Content is required" });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError({ statusCode: 404, message: "Comment not found" });
    }

    if (comment?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError({
            statusCode: 400,
            message: "Only the comment owner can edit their comment",
        });
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        comment?._id,
        { $set: { content } },
        { new: true }
    );

    if (!updatedComment) {
        throw new ApiError({
            statusCode: 500,
            message: "Failed to edit comment, please try again",
        });
    }

    return res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            data: updatedComment,
            message: "Comment edited successfully",
        })
    );
});

// Delete a comment
const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError({ statusCode: 404, message: "Comment not found" });
    }

    if (comment?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError({
            statusCode: 400,
            message: "Only the comment owner can delete their comment",
        });
    }

    await Comment.findByIdAndDelete(commentId);

    await Like.deleteMany({ comment: commentId, likedBy: req.user });

    return res.status(200).json(
        new ApiResponse({
            statusCode: 200,
            data: { commentId },
            message: "Comment deleted successfully",
        })
    );
});

export { getVideoComments, addComment, updateComment, deleteComment };
