import { Status } from "@prisma/client";
import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class EventCreateDto {

    @IsNotEmpty()
    @IsString()
    @MaxLength(30)
    name: string;

    @IsOptional()
    @IsString()
    @MaxLength(85)
    description?: string;

    @IsOptional()
    @IsString()
    @MaxLength(35)
    shortDescription?: string;

    @IsNotEmpty()
    @IsDateString()
    date: string | Date;

    @IsOptional()
    status: Status = Status.WAITING;
}