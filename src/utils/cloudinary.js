import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})


const uploadToCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        // console.log("file uploaded to cloudinary",response.url);
        fs.unlinkSync(localFilePath);//remove locally save temp file
        return response;
    }
    catch (err) {
        fs.unlinkSync(localFilePath);//remove locally save temp file as the upload failed
        console.log("error uploading file to cloudinary", err);
        return null;
    }
}

const deleteFromCloudinary = async (publicURL) => {
    try {
        const result = await cloudinary.uploader.destroy(publicURL);
        return result;
    } catch (error) {
        console.log("error at cloudinarydelete function", error);
    }
};

export { uploadToCloudinary, deleteFromCloudinary }