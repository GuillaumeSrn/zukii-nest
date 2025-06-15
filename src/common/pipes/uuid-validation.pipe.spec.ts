import { BadRequestException } from '@nestjs/common';
import { UuidValidationPipe } from './uuid-validation.pipe';

describe('UuidValidationPipe', () => {
  let pipe: UuidValidationPipe;

  beforeEach(() => {
    pipe = new UuidValidationPipe();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should pass valid UUID v4', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';
    expect(pipe.transform(validUuid)).toBe(validUuid);
  });

  it('should pass valid UUID v1', () => {
    const validUuid = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
    expect(pipe.transform(validUuid)).toBe(validUuid);
  });

  it('should throw BadRequestException for invalid UUID', () => {
    const invalidUuid = 'invalid-uuid';
    expect(() => pipe.transform(invalidUuid)).toThrow(BadRequestException);
  });

  it('should throw BadRequestException for empty string', () => {
    expect(() => pipe.transform('')).toThrow(BadRequestException);
  });

  it('should throw BadRequestException for UUID-like but invalid string', () => {
    const invalidUuid = '123e4567-e89b-12d3-a456-42661417400g'; // 'g' à la fin
    expect(() => pipe.transform(invalidUuid)).toThrow(BadRequestException);
  });
});
