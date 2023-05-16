import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UserCreateDto {
    @IsEmail()
    email: string;
    
    @IsNotEmpty()
    @IsString()
    password: string;

    @IsOptional()
    @IsString()
    name?: string;
}