import { createReadStream } from 'streamifier';
import { UploadApiErrorResponse, UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CloudinaryService {
    async uploadImage(buffer: string | Buffer | Uint8Array) {
        const streamUpload = function(): Promise<UploadApiResponse | UploadApiErrorResponse> {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                  (error, result) => {
                    if (result) {
                      return resolve(result);
                    } else {
                      return reject(error);
                    }
                  }
                );
    
              createReadStream(buffer).pipe(stream);
            });
        };
        const uploadedImage = await streamUpload();
        return uploadedImage.secure_url;
    }
}
