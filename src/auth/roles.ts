import { SetMetadata } from "@nestjs/common";
import { Role as UserRole} from '@prisma/client'

export enum Role {
    PERSON = "PERSON",
    ORGANIZATION = "ORGANIZATION",
    ADMIN = "ADMIN",
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);