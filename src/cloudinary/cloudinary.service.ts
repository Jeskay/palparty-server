import { createReadStream } from 'streamifier';
import { UploadApiErrorResponse, UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import { Injectable, Logger } from '@nestjs/common';

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

    async updateImage( newImage: string | Buffer | Uint8Array, oldUrl?: string | null) {
      if(oldUrl) {
        await this.deleteImage(oldUrl);
      }
      return await this.uploadImage(newImage);
    }

    async deleteImage(url: string ) {
      const filename = url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.'))
      Logger.log(`deleting ${filename}`,'Storage clearance')
      await cloudinary.uploader.destroy(filename, (err, response) => {
        if (err) {
          Logger.error(response, 'Delete image from cloudinary')
        } else
          Logger.log(response.result, 'Storage clearance')
      })
    }
}
