import mongoose from "mongoose";
import { User } from "./user.model.js";

const videoSchema = mongoose.Schema(
    {
        videoFile: {
            type: String,
            required: true,
        },

        thumbnail: {
            type: String,
            required: true,
        },

        title: {
            type: String,
            default: Date.now(),
        },

        description: {
            type: String,
            default: "no description availiable",
        },

        duration: {
            type: Number,
            required: true,
        },

        views: {
            type: Number,
            default: 0,
        },

        isPublished: {
            type: Boolean,
            default: false,
        },

        owner: {
            type: mongoose.Schema.type.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

export const Video = mongoose.model("Video", videoSchema);
