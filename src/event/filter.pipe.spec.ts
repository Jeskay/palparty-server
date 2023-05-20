import { ArgumentMetadata, BadRequestException } from "@nestjs/common";
import { FilterPipe } from "./filter.pipe";
import { Status } from "@prisma/client";

describe('FilterPipe', () => {
    let pipe: FilterPipe;
    const metadata: ArgumentMetadata = {
        type: 'body',
    }
    it('it should be defined', () => {
        expect(new FilterPipe()).toBeDefined();
    })

    beforeEach(() => {
        pipe = new FilterPipe();
    })

    it('should throw error for non strings', () => {
        const value = () => pipe.transform(123, metadata);
        expect(value).toThrowError(BadRequestException);
    })

    it('should return empty values back', () => {
        const value = () => pipe.transform(undefined, metadata);
        expect(value()).toBe(undefined);
    })

    it('should throw error for an invalid value', () => {
        const value = () => pipe.transform('foo', metadata);
        expect(value).toThrowError(BadRequestException);
    })

    it('should return status for correct value', () => {
        expect(pipe.transform('ACTIVE', metadata)).toEqual([Status.ACTIVE])
        expect(pipe.transform('PREPARING', metadata)).toEqual([Status.PREPARING])
        expect(pipe.transform('WAITING', metadata)).toEqual([Status.WAITING])
        expect(pipe.transform('PASSED', metadata)).toEqual([Status.PASSED])
    })

    it('should throw error for list that have incorrect value', () => {
        const value = () => pipe.transform("ACTIVE,PASSED,FOO,WAITING", metadata);
        expect(value).toThrowError(BadRequestException);
    })

    it('should return status array for correct values', () => {
        const value = () => pipe.transform("ACTIVE,PASSED,PREPARING,WAITING", metadata)
        expect(value()).toEqual([Status.ACTIVE, Status.PASSED, Status.PREPARING, Status.WAITING])
    })

});