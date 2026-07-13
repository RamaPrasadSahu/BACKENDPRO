import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const pipeline = []
    if(query){
        pipeline.push({
            $match : {
                $or : [
                    { title: { $regex: query, $options: "i" } },
                    { description: { $regex: query, $options: "i" } }
                ]
            }
        })
    }
    if(userId){
        if(!isvalidObjectId(userId)){
            throw new ApiError(400, "Invalid user ID")
        }
        pipeline.push({
            $match : {
                ownner : mongoose.Types.ObjectId(userId)
            }
        })
    }
    pipeline.push({
        $match : { ispublishhed : true}
    })
    if(sortby){
        pipeline.push({
            $sort : {
                [sortBy] : sortType === "asc" ? -1 : 1
            }
        })
    }
    else{
        pipeline.push({
            $sort : {
                createdAt : -1
            }
        })
    }
    pipeline.push({
        $lookup : {
            from : "users",
            localField : "owner",
            foreignField : "_id",
            as : "ownerDetails",
            pipeline : [
                {
                    $project : {
                        username : 1,
                        avatar_url : 1,
                        fullname : 1
                    }
                }
            ]
        }
    })
    $addFields : {
        ownerDetails : {
            $first : "$ownerDetails"
        }
    }
    const videoaggregate = Video.aggregate(pipeline)
    const options = {
        page : parseInt(page, 10),
        limit : parseInt(limit, 10),
    }
    const videos = await Video.aggregatePaginate(videoaggregate, options)
    return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
  if(!title || !description){
    throw new ApiError(400, "Title and description are required")
  }
  const videofilelocalpath = req.files.video[0].path
  const thumbnailfilelocalpath = req.files.thumbnail[0].path
  if(!videofilelocalpath || !thumbnailfilelocalpath){
    throw new ApiError(400, "Video and thumbnail files are required")
  }  
  const videofile =  await uploadOnCloudinary(videofilelocalpath)
  if(!videofile){
    throw new ApiError(500, "Video upload failed")
  }
  const thumbnailfile = await uploadOnCloudinary(thumbnailfilelocalpath)
  if(!thumbnailfile){
    throw new ApiError(500, "Thumbnail upload failed")
  }
  const video = await Video.create({
    title,
    description,
    video_url : videofile.url,
    thumbnail_url : thumbnailfile.url,
    owner : req.user._id,
    ispublishhed : true
    })
    const uploadvideo = await Video.findById(video._Id)
    if(!uploadvideo){
        throw new ApiError(500, "Video upload failed")
    }
    return res
    .status(201)
    .json(new ApiResponse(201, uploadvideo, "Video uploaded successfully")) 
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID")
    }
    const video = await Video.findById(videoId).populate("owner", "username avatar_url fullname")
    if(!video){
        throw new ApiError(404, "Video not found")
    }
    video.views += 1
    await video.save({ validateBeforeSave : false})
    if(req.user?._id){ // User is logged in

        await User.findByIdAndUpdate(req.user._id, {
            $addToSet : {
                watchhistory : videoId
            }
        })
     }
     return res
        .status(200)
        .json(new ApiResponse(200,video, "Video fetched successfully"))


})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params 
    const { title, description } = req.body
    //TODO: update video details like title, description, thumbnail
        if(!isValidObjectId(videoId)){
            throw new ApiError(400, "Invalid video ID")
        }
        const thumbnaulfilelocalpath = req.files?.path
        if(!title && !description && !thumbnaulfilelocalpath){
            throw new ApiError(400, "At least one field is required to update")
        }
        const video = await Video.findById(videoId)
        if(!video){
            throw new ApiError(404, "Video not found")
        }
        if(video.owner.toString() !== req.user._id.toString()){
            throw new ApiError(403, "You are not authorized to update this video")
        }
        const updateData = {}
        if(title) updateData.title = title
        if(description) updateData.description = description
        if(thumbnaulfilelocalpath){
            const thumbnailfile = await uploadOnCloudinary(thumbnaulfilelocalpath)
        
        if(!thumbnailfile.url){
            throw new ApiError(500, "Thumbnail upload failed")
        }
        updateData.thumbnail=thumbnail_url
        if(video.thumbnail){
            const publicId = video.thumbnail
            .split("/")
            .pop()
            .split(".")[0]
            await deleteFromCloudinary(publicId)
        }
    }
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: updateData },
        { new: true }
    )
    if(!updateVideo){
        throw new ApiError(500, "Video update failed")
    }
    return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video not found")
    }
    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to delete this video")
    }
    // Delete the video from Cloudinary (if applicable)
    // Then delete the video document from MongoDB
    const deletedVideo = await Video.findByIdAndDelete(videoId)
    if(!deletedVideo){
        throw new ApiError(500, "Video deletion failed")
    }
    const VideoPublicId = video.videofile.split("/").pop().split(".")[0]
    const ThumbnailPublicId = video.thumbnail.split("/").pop().split(".")[0]
    await deleteFromCloudinary(VideoPublicId,"video")
    await deleteFromCloudinary(ThumbnailPublicId,"image")
    await Like.deleteMany({ video: videoId })
    await Comment.deleteMany({ video: videoId })
    return res
    .status(200)
    .json(new ApiResponse(200, deletedVideo, "Video deleted successfully"))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video not found")
    }
    if(video.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to change the publish status of this video")
    }
    video.ispublished = !video.ispublished
   const updateVideo= await video.save({
        validateBeforeSave: false
    })
    if(!updateVideo){
        throw new ApiError(500, "Failed to update publish status")
    }
    return res
    .status(200)
    .json(new Apiresponse(200,{ispublished: updateVideo.ispublished}, "Publish status updated successfully"))
    
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}