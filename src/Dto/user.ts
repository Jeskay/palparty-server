import { Transform } from "class-transformer";
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

export class UserCreateDto {
    @IsEmail()
    email: string;
    
    @IsNotEmpty()
    @IsString()
    password: string;

    @IsNotEmpty()
    @IsInt()
    @Min(18)
    @Max(100)
    
    age: number;

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