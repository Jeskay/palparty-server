import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

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

export class UserUpdateDto {

    @IsOptional()
    @IsString()
    @MaxLength(30)
    name?: string;

    @IsOptional()
    @IsString()
    @MinLength(5)
    password?: string;
}