import { Playlist } from "../models/playlist.models.js";
import { Video } from "../models/video.model.js";
import ApiResponse from "../utils/ApiResposne.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name || !description) {
        throw new ApiError({ statusCode: 400, message: "Name and description are required." });
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id,
    });

    if (!playlist) {
        throw new ApiError({ statusCode: 500, message: "Failed to create playlist." });
    }

    return res.status(200).json(
        new ApiResponse({ statusCode: 200, data: playlist, message: "Playlist created successfully." })
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const { playlistId } = req.params;

    if (!name || !description) {
        throw new ApiError({ statusCode: 400, message: "Name and description are required." });
    }

    if (!isValidObjectId(playlistId)) {
        throw new ApiError({ statusCode: 400, message: "Invalid Playlist ID." });
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError({ statusCode: 404, message: "Playlist not found." });
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError({ statusCode: 403, message: "Only the owner can edit this playlist." });
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $set: { name, description } },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse({ statusCode: 200, data: updatedPlaylist, message: "Playlist updated successfully." })
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError({ statusCode: 400, message: "Invalid Playlist ID." });
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError({ statusCode: 404, message: "Playlist not found." });
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError({ statusCode: 403, message: "Only the owner can delete this playlist." });
    }

    await Playlist.findByIdAndDelete(playlistId);

    return res.status(200).json(
        new ApiResponse({ statusCode: 200, data: {}, message: "Playlist deleted successfully." })
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError({ statusCode: 400, message: "Invalid Playlist ID or Video ID." });
    }

    const playlist = await Playlist.findById(playlistId);
    const video = await Video.findById(videoId);

    if (!playlist) {
        throw new ApiError({ statusCode: 404, message: "Playlist not found." });
    }
    if (!video) {
        throw new ApiError({ statusCode: 404, message: "Video not found." });
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError({ statusCode: 403, message: "Only the owner can add videos to their playlist." });
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $addToSet: { videos: videoId } },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse({ statusCode: 200, data: updatedPlaylist, message: "Video added to playlist successfully." })
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError({ statusCode: 400, message: "Invalid Playlist ID or Video ID." });
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError({ statusCode: 404, message: "Playlist not found." });
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError({ statusCode: 403, message: "Only the owner can remove videos from their playlist." });
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $pull: { videos: videoId } },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse({ statusCode: 200, data: updatedPlaylist, message: "Video removed from playlist successfully." })
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError({ statusCode: 400, message: "Invalid Playlist ID." });
    }

    const playlistVideos = await Playlist.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(playlistId) } },
        { $lookup: { from: "videos", localField: "videos", foreignField: "_id", as: "videos" } },
        { $match: { "videos.isPublished": true } },
        { $lookup: { from: "users", localField: "owner", foreignField: "_id", as: "owner" } },
        {
            $addFields: {
                totalVideos: { $size: "$videos" },
                totalViews: { $sum: "$videos.views" },
                owner: { $first: "$owner" },
            },
        },
        {
            $project: {
                name: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1,
                totalVideos: 1,
                totalViews: 1,
                videos: {
                    _id: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    title: 1,
                    description: 1,
                    duration: 1,
                    createdAt: 1,
                    views: 1,
                },
                owner: { username: 1, fullName: 1, "avatar.url": 1 },
            },
        },
    ]);
    console.log(playlistVideos)

    if (!playlistVideos.length) {
        throw new ApiError({ statusCode: 404, message: "Playlist not found." });
    }

    return res.status(200).json(
        new ApiResponse({ statusCode: 200, data: playlistVideos[0], message: "Playlist fetched successfully." })
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError({ statusCode: 400, message: "Invalid User ID." });
    }

    const playlists = await Playlist.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(userId) } },
        { $lookup: { from: "videos", localField: "videos", foreignField: "_id", as: "videos" } },
        {
            $addFields: {
                totalVideos: { $size: "$videos" },
                totalViews: { $sum: "$videos.views" },
            },
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                totalVideos: 1,
                totalViews: 1,
                updatedAt: 1,
            },
        },
    ]);

    return res.status(200).json(
        new ApiResponse({ statusCode: 200, data: playlists, message: "User playlists fetched successfully." })
    );
});

export {
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    getPlaylistById,
    getUserPlaylists,
};
