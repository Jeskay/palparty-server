import { createReadStream } from 'streamifier';
import { UploadApiErrorResponse, UploadApiOptions, UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import { Inject, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CloudinaryService {
  private readonly folder: string
  constructor() {
    this.folder = `${process.env.MODE}_folder`;
  }

    async uploadImage(buffer: string | Buffer | Uint8Array) {
        const streamUpload = function(options?: UploadApiOptions): Promise<UploadApiResponse | UploadApiErrorResponse> {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                  options,
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
        const uploadedImage = await streamUpload({
          folder: this.folder
        });
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
