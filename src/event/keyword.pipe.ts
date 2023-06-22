import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from "@nestjs/common";

@Injectable()
export class KeywordPipe implements PipeTransform {
    transform(value: any, metadata: ArgumentMetadata): string[] | undefined {
        if(value == undefined) {
            return value
        }
        if(typeof value !== "string") {
            throw new BadRequestException("Validation failed (string expected)")
        }
        const keywords = value.split(' ');
        if (keywords.length == 0) {
            throw new BadRequestException("Validation failed (expected string of status type)")
        }
        return keywords
    }
}