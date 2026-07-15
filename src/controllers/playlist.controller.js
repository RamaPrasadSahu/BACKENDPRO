import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
   
    
    if(!name.trim() || !description.trim()) {
        throw new ApiError(400, "Name and description cannot be empty")
    }
    const playlist = await  Playlist.create({
        name : name.trim(),
        description : description.trim(),
        videos : [],
        owner : req.user?._id
    })
    if(!playlist){
        throw new ApiError(500, "Something Went Wrong While Creating The Playlist")
    }
    return res
        .status(200)
        .json(new ApiResponse(200 , playlist , "playlist Created SucessFully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!isValidObjectId(userId)){
        throw new ApiError(400 , "UserId is Not Valid")
    }
    const playlist = await Playlist.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(userId) 
            }
        },
        {
            $addFields : {
                totalvideos : {$size : "$videos"}
            }
        },
        {
            $project : {
                name : 1,
                description : 1,
                totalvideos : 1,
                owner : 1,
                createdAt : 1,
                updatedAt : 1
            }
        }
    ])
    return res
            .status(200)
            .json(new ApiResponse(200, playlist, "User Playlist Fetched Successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400 , " Invalid ObjectId")
    }
    const playlist = await Playlist.findById(playlistId)
   if(!playlist){
     throw new ApiError(404 , "Playlist Not Found")
   }   
   return res
        .status(200)
        .json(new ApiResponse(200 , playlist , "Playlist fetched Successfully"))
 
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
        if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
            throw new ApiError(400 , "Invalid Ids")
        } 
        const playlist = await Playlist.findById(playlistId)
        if(!playlist){
            throw new ApiError(404,"playlist not found")
        }   
        const video = await Video.findById(videoId)
        if(!video){
            throw new ApiError(404 , "Video not found")
        }
        if(playlist.owner.toString()!== req.user?._id.toString()){
            throw new ApiError(404 , "You Are Not Authorized to Edit the Playlist")
        }
        if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video already exists in the playlist")
        }
        const updateplaylist = await playlist.findByIdAndUpdate(
            playlistId,
            {
                $addToSet : { videos : videoId }
            },
            {new : true}
        )
        return res
            .status(200)
            .json(new ApiResponse(200,updateplaylist,"Playlist Updated Successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
            throw new ApiError(400 , "Invalid Ids")
        } 
        const playlist = await Playlist.findById(playlistId)
        if(!playlist){
            throw new ApiError(404,"playlist not found")
        }   
        const video = await Video.findById(videoId)
        if(!video){
            throw new ApiError(404 , "Video not found")
        }
        if(playlist.owner.toString()!== req.user?._id.toString()){
            throw new ApiError(403 , "You Are Not Authorized to Edit the Playlist")
        }
        if(!playlist.videos.includes(videoId)){
            throw new ApiError(400, "video is not part of  The Playlist")
        }
        const updatePlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $pull : { videos : videoId }
            },
            { new : true}
        )
      return res
            .status(200)
            .json(new ApiResponse(200, updatePlaylist , " Video Removed SuccessFully"))
          
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid ObjectId")
    }
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404 , "Playlist Not Avalible")
    }
    if(playlist.owner.toString()!== req.user?._id.toString()){
        throw new ApiError(403 , "You are not authorized to Delete Playlist ")
    }
    await Playlist.findByIdAndDelete(playlistId)
    return res
            .status(200)
            .json(new ApiResponse(200, {}," Playlist deleted Successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400 , "Invalid ObjectId")
    }
    if(!name?.trim() || !description?.trim()){
        throw new ApiError(400 , "Name And Description Are Required")
    }
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404 , "Playlist Is not Available")
    }
    if (playlist.owner.toString()!== req.user?._id.toString()) {
        throw new ApiError(403 , "You Are Not Authorized to update playlist")
    }
    const UpdatePlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set : {
                name : name.trim(),
                description : description.trim()
            }
        },
        {new : true}
    )
    return res
            .status(200)
            .json(new ApiResponse(200 , UpdatePlaylist , "Playlist Updated SuccessFully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
