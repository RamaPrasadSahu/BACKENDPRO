import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Tweet } from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, " InValid ObjectID")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, " Video Not Found")
    }
    const Existinglike = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id
    })
    if (Existinglike) {
        await Like.findByIdAndDelete(Existinglike._id)

        return res
            .status(200)
            .json(new ApiResponse(200, { isliked: false }, "Video Like Removed SuccessFully"))
    }
    await Like.create({
        video: videoId,
        likedBy: req.user?._id
    })
    return res
        .status(200)
        .json(new ApiResponse(200, { isliked: true }, " Video Liked Successfully"))

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid Object ID")
    }
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, " Comment Like Not Found")
    }
    const Existinglike = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id
    })
    if (Existinglike) {
        await Like.findByIdAndDelete(Existinglike._id)
        return res
            .status(200)
            .json(new ApiResponse(200, { isliked: false }, "Comment like deleted Successfully"))

    }
    await Like.create({
        comment: commentId,
        likedBy: req.user?._id
    })
    return res
        .status(200)
        .json(new ApiResponse(200, { isliked: true }, "Comment like Added Successfully"))


})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid TweetId")
    }
    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, " Tweet Not found")
    }
    const deletelike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id
    })
    if (deletelike) {
        const deleted = await Like.findByIdAndDelete(deletelike._id)
        if (!deleted) {
            throw new ApiError(500, "Unable to Remove Like")
        }
        return res
            .status(200)
            .json(new ApiResponse(200, { isliked: false }, " Like Removed Successfully"))
    }
    const newlike = await Like.create({
        tweet: tweetId,
        likedBy: req.user?._id
    })
    if (!newlike) {
        throw new ApiError(500, " Tweet like Not Added")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, { isliked: true }, " Tweet Liked Successfully"))


})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const Likedvideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id),
                video: { $exists: true, $ne: null }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: { $first: "$owner" }
                        }
                    }
                ]

            }
        },
        {
            $unwind: "$video"
        },
        {
            $project: {
                video: 1,
                _id: 0
            }
        }
    ])
    return res
        .status(200)
        .json(new ApiResponse(200, Likedvideos, " Liked video Fetched SuccessFully"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}