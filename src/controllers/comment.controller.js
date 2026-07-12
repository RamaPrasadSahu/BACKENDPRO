import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    if(!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    const video = await video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video not found")
    }
    const commentaggregate = Comment.aggregate([
        {
            $match : { videoId: new mongoose.Types.ObjectId(videoId) }
        },
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as:"owner",
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
        {$addFields :
            {
                owner : {
                    $first : "$owner"
                }
            }
        },
        {
            $sort : {
                createdAt : -1
            }
        }
    ])
    const options = {
        page : parseInt(page, 10),
        limit : parseInt(limit, 10),
    }

    const comments = await Comment.aggregatePaginate(commentaggregate, options)
    return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"))
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const {content} = req.body
    if(!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400 , "Invalid video Id")
    }
    if(!content) {
        throw new ApiError(400 , "Content is required")
    }
    const video = await video.findById(videoId)
    if(!video) {
        throw new ApiError(404 , "Video not found")
    }
    const comment = await Comment.create({
        content,
        owner : req.user._id,
        videoId
    })
    return res
    .status(201)
    .json(new ApiResponse(201,comment, "Comment added Successfully"))
 
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {content} = req.body
    if(!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400 , "Invalid comment Id")
    }
    if(!content){
        throw new ApiError(400 , "Content is required")
    }
    const comment = await Comment.findById(commentId)
    if(!comment) {
        throw new ApiError(404 , "Comment not found")
    }
    if(!comment.owner.equals(req.user._id)) {
        throw new ApiError(403 , "You are not authorized to update this comment")
    }
    const updateComment = await Comment.findByIdAndUpdate(commentId, { $set :{ content: content }}, {new : true})
    if(!updateComment) {
        throw new ApiError(500 , "Failed to update comment")
    }
    return res
    .status(200)
    .json(new ApiResponse(200,updateComment, "comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params
    if(!mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400 , "Invalid comment Id")
    }
    const comment = await Comment.findById(commentId)
    if(!comment) {
        throw new ApiError(404 , "Comment not found")
    }
    if(!comment.owner.equals(req.user._id)) {
        throw new ApiError(403 , "You are not authorized to delete this comment")
    }
    const deletedComment = await Comment.findByIdAndDelete(commentId)
    if(!deletedComment) {
        throw new ApiError(500 , "Failed to delete comment")
    }
    return res
    .status(200)
    .json(new ApiResponse(200,deletedComment, "comment deleted successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }