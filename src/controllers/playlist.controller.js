import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  //TODO: create playlist

  try {
    const createPlaylist = await Playlist.create({
      name: name,
      description: description,
      owner: req.user._id,
    });

    if (!createPlaylist) {
      throw new ApiError(
        500,
        null,
        "Something went wrong at creating playlist"
      );
    }

    return res
      .status(201)
      .json(
        new ApiResponse(201, createPlaylist, "Playlist created successfully")
      );
  } catch (error) {
    throw new ApiError(500, null, "Something went wrong at creating playlist");
  }
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists

  try {
    const getUserPlaylists = await Playlist.find({ owner: userId });

    if (!getUserPlaylists) {
      throw new ApiError(404, null, "Playlists not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, getUserPlaylists, "Playlists fetched successfully")
      );
  } catch (error) {
    throw new ApiError(404, null, "Playlists not found");
  }
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id

  try {
    const getPlaylist_ById = await Playlist.findById(playlistId);

    if (!getPlaylist_ById) {
      throw new ApiError(404, null, "Playlist not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, getPlaylist_ById, "Playlist fetched successfully")
      );
  } catch (error) {
    throw new ApiError(404, null, "Playlist not found");
  }
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  try {
    const getVideo = await Playlist.findOne({
      _id: playlistId,
      videos: videoId,
    });

    if (getVideo) {
      throw new ApiError(400, null, "Video already added to playlist");
    }

    const addVideoToPlaylist = await Playlist.findByIdAndUpdate(playlistId, {
      $push: {
        videos: videoId,
      },
    });
    if (!addVideoToPlaylist) {
      throw new ApiError(
        500,
        null,
        "Something went wrong at adding video to playlist"
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          addVideoToPlaylist,
          "Video added to playlist successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      null,
      "Something went wrong at adding video to playlist"
    );
  }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist

  try {
    const getVideo = await Playlist.findOne({
      _id: playlistId,
      videos: videoId,
    });
    if (!getVideo) {
      throw new ApiError(404, null, "Video not found in playlist");
    }

    const removeVideoFromPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $pull: {
          videos: videoId,
        },
      }
    );
    if (!removeVideoFromPlaylist) {
      throw new ApiError(
        500,
        null,
        "Something went wrong at removing video from playlist"
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          removeVideoFromPlaylist,
          "Video removed from playlist successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      500,
      null,
      "Something went wrong at removing video from playlist"
    );
  }
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist

  try {
    const getplaylist = await Playlist.findById(playlistId);
    if (!getplaylist) {
      throw new ApiError(404, null, "Playlist not found");
    }
    const deletePlaylist = await Playlist.findByIdAndDelete(playlistId);

    if (!deletePlaylist) {
      throw new ApiError(
        500,
        null,
        "Something went wrong at deleting playlist"
      );
    }
    return res
      .status(500)
      .json(new ApiResponse(200, null, "Playlist deleted successfully"));
  } catch (error) {
    throw new ApiError(500, null, "Something went wrong at deleting playlist");
  }
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist

  try {
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      throw new ApiError(404, null, "Playlist not found");
    }

    const updatePlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        name: name,
        description: description,
      },
      { new: true }
    );
    if (!updatePlaylist) {
      throw new ApiError(
        500,
        null,
        "Something went wrong at updating playlist"
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatePlaylist, "Playlist updated successfully")
      );
  } catch (error) {
    throw new ApiError(500, null, "Something went wrong at updating playlist");
  }
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};