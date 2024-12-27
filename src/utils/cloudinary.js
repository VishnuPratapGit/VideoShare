import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    if (!localFilePath) return null;
    try {
        const uploadResult = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        console.log("File Uploaded on Cloudinary: ", uploadResult.url);
        return uploadResult;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        console.log("Error in File upload on Cloudinary:: cloudinary: ", error);
        return null;
    }
};

export { uploadOnCloudinary };

// (async function () {
//     // Optimize delivery by resizing and applying auto-format and auto-quality
//     const optimizeUrl = cloudinary.url("shoes", {
//         fetch_format: "auto",
//         quality: "auto",
//     });

//     console.log(optimizeUrl);

//     // Transform the image: auto-crop to square aspect_ratio
//     const autoCropUrl = cloudinary.url("shoes", {
//         crop: "auto",
//         gravity: "auto",
//         width: 500,
//         height: 500,
//     });

//     console.log(autoCropUrl);
// })();
