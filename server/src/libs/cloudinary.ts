import { v2 as cloudinary } from 'cloudinary';
import { env } from '@/config/env.js';



cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: env.NODE_ENV === 'production'

});

export const uploadImage = async (
    buffer: Buffer,
    folder: string,
): Promise<{ url: string; publicId: string}> => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader
            .upload_stream({folder, resource_type: "image"}, (err, result) => {
                if (err || !result ) return reject(err);
                resolve({url: result.secure_url, publicId: result.public_id})
            })
            .end(buffer)
    })
}

export const deleteImage = async (publicId: string) : Promise<void> => {
    await cloudinary.uploader.destroy(publicId);
}
