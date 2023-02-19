import { SetMetadata } from "@nestjs/common";
import { Role as UserRole} from '@prisma/client'

export const Role = {
    Person: UserRole.PERSON,
    Organization: UserRole.ORGANIZATION,
    Admin: UserRole.ADMIN,
}
export type Role = typeof Role[keyof typeof Role];

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);