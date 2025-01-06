import mongoose, { isValidObjectId } from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResposne.js";
import { Subscription } from "../models/subscription.model.js";

export const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError({ statusCode: 400, message: "Invalid channelId" });
    }

    const isSubscribed = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelId,
    });

    if (isSubscribed) {
        await Subscription.findByIdAndDelete(isSubscribed?._id);

        return res
            .status(200)
            .json(
                new ApiResponse(
                    {
                        statusCode: 200,
                        data: { subscribed: false },
                        message: "unsunscribed successfully"
                    }
                )
            );
    }

    await Subscription.create({
        subscriber: req.user?._id,
        channel: channelId,
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                {
                    statusCode: 200,
                    data: { subscribed: true },
                    message: "subscribed successfully"
                }
            )
        );
});


export const getChannelSubscribers = asyncHandler(async (req, res) => {
    let { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        return res.status(400).json(
            new ApiError({
                statusCode: 400,
                message: "Invalid channel id",
            })
        );
    }

    channelId = new mongoose.Types.ObjectId(channelId);

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: channelId,
            },
        },
        {
            // Step 2: Lookup subscriber details from the users collection
            $lookup: {
                from: "users", // Target collection to join with
                localField: "subscriber", // Field in Subscription collection
                foreignField: "_id", // Corresponding field in the users collection
                as: "subscriber", // Output field to store user details
                pipeline: [ // Additional operations to perform on the joined data
                    {
                        // Step 2.1: Lookup subscriptions for the current subscriber
                        $lookup: {
                            from: "subscriptions", // Target collection
                            localField: "_id", // Current subscriber's ID
                            foreignField: "channel", // Matches this field in the Subscription collection
                            as: "subscribedToSubscriber", // Output field
                        },
                    },
                    {
                        // Step 2.2: Add calculated fields to each subscriber document
                        $addFields: {
                            subscribedToSubscriber: {
                                // Check if the channel is subscribed to this subscriber
                                $cond: {
                                    if: {
                                        $in: [
                                            channelId, // Current channelId
                                            "$subscribedToSubscriber.subscriber", // List of subscribers for this user
                                        ],
                                    },
                                    then: true, // If channelId is found, mark as subscribed
                                    else: false, // Otherwise, mark as not subscribed
                                },
                            },
                            // Count the number of subscriptions this subscriber has
                            subscribersCount: {
                                $size: "$subscribedToSubscriber",
                            },
                        },
                    },
                ],
            },
        },
        {
            // Step 3: Deconstruct the subscriber array into individual documents
            $unwind: "$subscriber",
        },
        {
            // Step 4: Select only specific fields to return in the response
            $project: {
                _id: 0, // Exclude the top-level _id field
                subscriber: {
                    _id: 1, // Include subscriber's ID
                    username: 1, // Include subscriber's username
                    fullName: 1, // Include subscriber's full name
                    "avatar.url": 1, // Include the subscriber's avatar URL
                    subscribedToSubscriber: 1, // Include subscription status
                    subscribersCount: 1, // Include the number of subscribers
                },
            },
        },
    ]);

    // Return the aggregated subscriber data as a response
    return res
        .status(200)
        .json(
            new ApiResponse(
                {
                    statusCode: 200,
                    data: subscribers, // Subscribers fetched from the pipeline
                    message: "Subscribers fetched successfully", // Success message
                }
            )
        );
});


export const getSubscribedChannels = asyncHandler(async (req, res) => {
    // Extract `subscriberId` from the request parameters
    const { subscriberId } = req.params;

    // Perform an aggregation query on the Subscription collection
    const subscribedChannels = await Subscription.aggregate([
        {
            // Step 1: Match subscriptions where the subscriber matches the given subscriberId
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId), // Convert subscriberId to ObjectId
            },
        },
        {
            // Step 2: Lookup channel details from the users collection
            $lookup: {
                from: "users", // Target collection to join with
                localField: "channel", // Field in Subscription collection
                foreignField: "_id", // Corresponding field in the users collection
                as: "subscribedChannel", // Output field to store channel details
                pipeline: [ // Additional operations to perform on the joined data
                    {
                        // Step 2.1: Lookup videos created by the current channel
                        $lookup: {
                            from: "videos", // Target collection
                            localField: "_id", // Current channel's ID
                            foreignField: "owner", // Matches this field in the Videos collection
                            as: "videos", // Output field to store the videos
                        },
                    },
                    {
                        // Step 2.2: Add a calculated field for the latest video
                        $addFields: {
                            latestVideo: {
                                $last: "$videos", // Fetch the last video in the videos array (most recent)
                            },
                        },
                    },
                ],
            },
        },
        {
            // Step 3: Deconstruct the subscribedChannel array into individual documents
            $unwind: "$subscribedChannel",
        },
        {
            // Step 4: Select only specific fields to include in the final response
            $project: {
                _id: 0, // Exclude the top-level _id field
                subscribedChannel: {
                    _id: 1, // Include channel's ID
                    username: 1, // Include channel's username
                    fullName: 1, // Include channel's full name
                    "avatar.url": 1, // Include the channel's avatar URL
                    latestVideo: { // Include details of the latest video
                        _id: 1, // Video ID
                        "videoFile.url": 1, // Video file URL
                        "thumbnail.url": 1, // Video thumbnail URL
                        owner: 1, // Video owner
                        title: 1, // Video title
                        description: 1, // Video description
                        duration: 1, // Video duration
                        createdAt: 1, // Video creation date
                        views: 1, // Video views count
                    },
                },
            },
        },
    ]);

    // Return the aggregated subscribed channels data as a response
    return res
        .status(200)
        .json(
            new ApiResponse(
                {
                    statusCode: 200,
                    data: subscribedChannels, // Channels fetched from the pipeline
                    message: "Subscribed channels fetched successfully", // Success message
                }
            )
        );
});
