import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, User } from '@prisma/client';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
type SafeUser = PartialBy<User, 'password'>

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  async user(userWhereUniqueInput: Prisma.UserWhereUniqueInput) {
    return this.prisma.user.findUnique({ 
      where: userWhereUniqueInput,
      include: {
        eventsParticipant: true,
        eventsHosting: true,
      }
    });
  }

  async createUser(data: Prisma.UserCreateInput, image?: string | Buffer | Uint8Array) {
    if(image) {
      const imageUrl = await this.cloudinaryService.uploadImage(image);
      data.image = imageUrl;
      Logger.log(imageUrl, "Image uploaded to cloud");
    }
    return this.prisma.user.create({ data: data });
  }

  async users() {
    return this.prisma.user.findMany();
  }

  async updateUserInfo(user: SafeUser, image: any, data: Prisma.UserUpdateInput ): Promise<User>
  async updateUserInfo(user: SafeUser, image: any): Promise<User>
  async updateUserInfo(user: SafeUser, image?: any, data?: Prisma.UserUpdateInput ): Promise<User> {
    const newData = data ?? {}
    if(image) {
      const imageUrl = await this.cloudinaryService.updateImage(image, user.image ?? undefined);
      newData.image = imageUrl;
    }
    return await this.prisma.user.update({
      where: {
        id: user.id
      }, 
      data: newData
    });
  }

  async UpdateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }) {
    const { where, data } = params;
    return this.prisma.user.update({ data, where });
  }

  async deleteUser(where: Prisma.UserWhereUniqueInput) {
    return this.prisma.user.delete({ where });
  }
}
