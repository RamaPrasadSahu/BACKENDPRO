import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body
    if(!content || content.trim() === ""){
        throw new ApiError(400 , " Content Is Required")
    }
        const tweet = await Tweet.create({
            content,
            owner : req.user?._id
        })
        if (!tweet) {
            throw new ApiError(500 , "Failed to create tweet, please try again")
        }
        return res
                .status(200)
                .json(new ApiResponse(200 , tweet , "tweet created Successfully"))
    
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params
    if (!isValidObjectId(userId)) {
        throw new ApiError(400 , "userId is not valid")
    }
    const tweets = await Tweet.aggregate([
        {
            $match : { owner : new mongoose.Types.ObjectId(userId) }
        },
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "ownerdetails"
            }
        },
        {
            $addFields : {
                ownerdetails : {
                    $first : "$ownerdetails"
                }
            }
        },
        {
            $project : {
                content : 1,
                owner : {
                    username : "$ownerdetails.username",
                    fullName : "$ownerdetails.fullName",
                    avatar : "$ownerdetails.avatar"
                },
                createdAt : 1
            }
        }
    ])
    return res
            .status(200)
            .json(new ApiResponse(200 , tweets , "user tweets fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {content} = req.body
    const {tweetID} = req.params
    if (!content || content.trim()=== "") {
        throw new ApiError(400 , "Content is required")
        }
    if (!isValidObjectId(tweetID)) {
        throw new ApiError(400 , "Tweet ID is required")
    }
    const tweet = await Tweet.findById(tweetID)
    if (!tweet) {
        throw new ApiError(404 , "Tweet Not Found ")
    }
    if (tweet.owner.toString()!== req.user?._id.toString()) {
        throw new ApiError(403 , "Only owner can edit the twweet")
    }
        const updatedtweet = await Tweet.findByIdAndUpdate(
            tweetID,
            {
                $set : { content }
            },
            {new : true}
        )
        if (!updatedtweet) {
            throw new ApiError(500,"Failed to update the tweet")
        }
        return res
                .status(200)
                .json(new ApiResponse(200 , updatedtweet , "Tweet Updated Successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400 , "Tweet ID is required")
    }
    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "Can't Find tweetId")
    }
    if (tweet.owner.toString()!== req.user?._id.toString()) {
        
        throw new ApiError(403 , "Only owner can delete the tweet")
    }
    await Tweet.findByIdAndDelete(tweetId)
      return res
            .status(200)
            .json(new ApiResponse(200 ,{}, "Tweet deleted SuccessFully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}