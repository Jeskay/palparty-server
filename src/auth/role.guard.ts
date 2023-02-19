import { Injectable, CanActivate, ExecutionContext, mixin, Type } from "@nestjs/common";
import { Role } from "./roles";

const RoleGuard = (role: Role): Type<CanActivate> => {
    class RoleGuardMixin implements CanActivate {
        canActivate(context: ExecutionContext){
            const request = context.switchToHttp().getResponse().req;
            console.log(request);
            return request.user?.role.includes(role);
        }
    }
    return mixin(RoleGuardMixin);
}
export default RoleGuard;