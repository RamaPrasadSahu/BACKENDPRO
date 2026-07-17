import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const channelID = req.user?._id;
    if (!isValidObjectId(channelID)) {
        throw new ApiError(400, "Invalid ID")
    }
    const totalSubscribers = await Subscription.countDocuments({
        channel: channelID
    })
    const videostats = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelID)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                likescount: { $size: "$likes" }
            }
        },
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" },
                totallikes: { $sum: "$likescount" }

            }
        },
        {
            $project: {
                _id: 0,
                totalVideos: 1,
                totalViews: 1,
                totallikes: 1

            }
        }
    ])
    const stats = {
        totalSubscribers,
        totalVideos: videostats[0]?.totalVideos || 0,
        totalViews: videostats[0]?.totalViews || 0,
        totallikes: videostats[0]?.totallikes || 0
    }
    return res
        .status(200)
        .json(new ApiResponse(200, stats, "channel Stats Fetched SuccessFully"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const ChannelID = req.user?._id
    if (!isValidObjectId(ChannelID)) {
        throw new ApiError(400, " Invalid ID")
    }
    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(ChannelID)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                likescount: { $size: "$likes" }
            }
        },
        {
            $sort: {
                createdAt: -1
            }

        },
        {
            $project: {
                likes: 0
            }
        }
    ])
    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Channel videos Fetched Successfully"))
})

export {
    getChannelStats,
    getChannelVideos
}