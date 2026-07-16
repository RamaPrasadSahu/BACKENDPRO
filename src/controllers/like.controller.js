import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, " InValid ObjectID")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404 , " Video Not Found")
    }
    const Existinglike = await Like.findOne({
        video : videoId,
        likedBy : req.user?._id
    })
    if(Existinglike){
        await Like.findByIdAndDelete(Existinglike._id)
        
        return res
            .status(200)
            .json(new ApiResponse(200 , {isliked : false} , "Video Like Removed SuccessFully"))
    }
    await Like.create({
        video : videoId,
        likedBy : req.user?._id
    })
    return res 
            .status(200)
            .json(new ApiResponse(200,{isliked : true }, " Video Liked Successfully"))

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!isValidObjectId(commentId)){
        throw new ApiError(400 , "Invalid Object ID") 
    }
    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(404 , " Comment Like Not Found")
    }
    const Existinglike = await Like.findOne({
        comment : commentId,
        likedBy : req.user?._id
    })
    if(Existinglike){
        await Like.findByIdAndDelete(Existinglike._id)
        return res
            .status(200)
            .json(new ApiResponse(200 , {isliked : false} , "Comment like deleted Successfully"))

        }
         await Like.create({
            comment : commentId,
            likedBy : req.user?._id
         })
    return res
            .status(200)
            .json(new ApiResponse(200 , {isliked : true} , "Comment like Added Successfully"))
   
    
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}