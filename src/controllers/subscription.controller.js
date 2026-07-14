import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
  if(!isValidateObjectId(channelId)) {
    throw new ApiError(400, "Invalid channelId")
  }
  if(!channelId.toString() === req.user?._Id.toString()){
      throw new ApiError(400, "You cannot subscribe to your own channel")
  }  
  const ExiStingSubscription = await Subscription.findOne({
    subscriber : req.User?._id,
    channel : channelId
  })
  if(ExiStingSubscription){
    await Subscription.findByIdAndDelete(ExiStingSubscription._id)
    return res
    .status(200)
    .json(new ApiResponse(200, "Unsubscribed successfully", null))
  }
  const newSubscription = await Subscription.create({
    subscriber : req.user?._id,
    channel : channelId
  })
  return res
    .status(200)
    .json(new ApiResponse(200,  {subscribed : true},"Subscribed successfully", ))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId")
    }
    const subscribers = await Subscription.aggregate([
        { 
            $match : { channel : mongoose.Types.ObjectId(channelId) }
        },
        {
        $lookup : { 
            from : "users",
            localField : "subscriber",
            foreignField : "_id",
            as : "subscriberDetails",
            pipeline : [
                {
                    $project : {
                        username : 1,
                        fullname : 1,
                        avatar : 1
                    }
                }
            ]
        }
        },
        {
            $unwind : "$subscriberDetails"
        },
        {
            $project : {
                _id : 0,
                subscriber : 1
            }
        }

    ])
    return res
    .status(200)
    .json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriberId")
    }
    const subscribedChannels = await Subscription.aggregate([
        {
            $match : { subscriber : mongoose.Types.ObjectId(subscriberId) }
        },
        {
            $lookup : {
                from : "users",
                localField : "channel",
                foreignField : "_id",
                as : "channelDetails",
                pipeline : [
                    {
                        $project : {
                            username : 1,
                            fullname : 1,
                            avatar : 1
                        }
                    }
                ]
            }
        },
        {
            $unwind : "$channelDetails"
        },
        {
            $project : {
                _id : 0,
                channel : 1
            }
        }
    ])
    return res
    .status(200)
    .json(new ApiResponse(200, subscribedChannels, "Subscribed channels fetched successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}