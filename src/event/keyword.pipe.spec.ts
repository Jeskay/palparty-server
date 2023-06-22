import { ArgumentMetadata, BadRequestException } from "@nestjs/common";
import { Status } from "@prisma/client";
import { KeywordPipe } from "./keyword.pipe";

describe('Keyword Pipe', () => {
    let pipe: KeywordPipe;
    const metadata: ArgumentMetadata = {
        type: 'body',
    }
    it('it should be defined', () => {
        expect(new KeywordPipe()).toBeDefined();
    })

    beforeEach(() => {
        pipe = new KeywordPipe();
    })

    it('should throw error for non strings', () => {
        const value = () => pipe.transform(123, metadata);
        expect(value).toThrowError(BadRequestException);
    })

    it('should return empty values back', () => {
        const value = () => pipe.transform(undefined, metadata);
        expect(value()).toBe(undefined);
    })

    it('should return string array for correct single value', () => {
        expect(pipe.transform('hiking', metadata)).toEqual(["hiking"])
        expect(pipe.transform('cinema', metadata)).toEqual(["cinema"])
        expect(pipe.transform('tired_of_this', metadata)).toEqual(["tired_of_this"])
    })

    it('should return string array for correct values', () => {
        const value = () => pipe.transform("Cool go to watch Avatar", metadata)
        expect(value()).toEqual(["Cool", "go", "to", "watch", "Avatar"])
    })

});