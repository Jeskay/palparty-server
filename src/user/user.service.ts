import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, User, UsersOnEvents, Event } from '@prisma/client';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { hash } from 'bcrypt';

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type SafeUser = PartialBy<User, 'password'>

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  async user(userWhereUniqueInput: Prisma.UserWhereUniqueInput, displayPasswordHash: boolean = false)
    : Promise<((User | SafeUser) & {eventsParticipant: UsersOnEvents[], eventsHosting: Event[] }) | null> {
    const user = await this.prisma.user.findUnique({ 
      where: userWhereUniqueInput,
      include: {
        eventsParticipant: true,
        eventsHosting: true,
      }
    });

    if(user === null || displayPasswordHash)
      return user;
    else {
      const {password, ...otherProps} = user;
      return otherProps;
    }
  }

  async createUser(data: Prisma.UserCreateInput, image?: string | Buffer | Uint8Array) {
    if(image) {
      const imageUrl = await this.cloudinaryService.uploadImage(image);
      data.image = imageUrl;
      Logger.log(imageUrl, "Image uploaded to cloud");
    }
    data.password = await hash(data.password, 10);
    const {password, ...otherProps} = await this.prisma.user.create({ data: data });
    return otherProps;
  }

  async users() {
    return this.prisma.user.findMany();
  }

  async updateUserInfo(user: SafeUser, image: any, data: Prisma.UserUpdateInput ): Promise<SafeUser>
  async updateUserInfo(user: SafeUser, image: any): Promise<SafeUser>
  async updateUserInfo(user: SafeUser, image?: any, data?: Prisma.UserUpdateInput ): Promise<SafeUser> {
    const newData = data ?? {}
    if(image) {
      const imageUrl = await this.cloudinaryService.updateImage(image, user.image ?? undefined);
      newData.image = imageUrl;
    }
    if(typeof newData.password == 'string') {
      newData.password = await hash(newData.password, 10);
    }
    const {password, ...otherProps} = await this.prisma.user.update({
      where: {
        id: user.id
      }, 
      data: newData
    });
    return otherProps
  }

  async deleteUser(where: Prisma.UserWhereUniqueInput) {
    return this.prisma.user.delete({ where });
  }
}
