import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common";
import { Status } from "@prisma/client";

@Injectable()
export class FilterPipe implements PipeTransform {
    transform(value: any, metadata: ArgumentMetadata): Status[] | undefined {
        if(value == undefined) {
            return value
        }
        if(typeof value !== "string") {
            throw new BadRequestException("Validation failed (string expected)")
        }
        const filters = value.split(',');
        const arr = filters.filter(str => 
            Object.values(Status)
            .includes(str as Status)
        ) as Status[];
        if(arr.length != filters.length) {
            throw new BadRequestException("Validation failed (Invalid value found in filter)")
        }
        if (arr.length == 0) {
            throw new BadRequestException("Validation failed (expected string of status type)")
        }
        return arr
    }
}