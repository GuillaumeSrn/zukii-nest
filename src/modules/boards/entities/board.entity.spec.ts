import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { Board } from './board.entity';

describe('Board Entity', () => {
  describe('Validations', () => {
    it('should pass validation avec des données valides', async () => {
      const boardData = {
        title: 'Mon Board Test',
        description: 'Description du board de test',
        ownerId: '550e8400-e29b-41d4-a716-446655440000',
        statusId: '550e8400-e29b-41d4-a716-446655440001',
        backgroundColor: '#FF5733',
      };

      const board = plainToClass(Board, boardData);
      const errors = await validate(board);

      expect(errors).toHaveLength(0);
    });

    it('should pass validation avec données minimales requises', async () => {
      const boardData = {
        title: 'Test',
        ownerId: '550e8400-e29b-41d4-a716-446655440000',
        statusId: '550e8400-e29b-41d4-a716-446655440001',
      };

      const board = plainToClass(Board, boardData);
      const errors = await validate(board);

      expect(errors).toHaveLength(0);
    });

    describe('title validation', () => {
      it('should fail when title is empty', async () => {
        const boardData = {
          title: '',
          ownerId: '550e8400-e29b-41d4-a716-446655440000',
          statusId: '550e8400-e29b-41d4-a716-446655440001',
        };

        const board = plainToClass(Board, boardData);
        const errors = await validate(board);

        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('title');
        expect(errors[0].constraints).toHaveProperty('isNotEmpty');
      });

      it('should fail when title is too short', async () => {
        const boardData = {
          title: 'AB',
          ownerId: '550e8400-e29b-41d4-a716-446655440000',
          statusId: '550e8400-e29b-41d4-a716-446655440001',
        };

        const board = plainToClass(Board, boardData);
        const errors = await validate(board);

        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('title');
        expect(errors[0].constraints).toHaveProperty('minLength');
        expect(errors[0].constraints?.minLength).toBe(
          'Le titre du board doit contenir au moins 3 caractères',
        );
      });

      it('should fail when title is too long', async () => {
        const boardData = {
          title: 'A'.repeat(201),
          ownerId: '550e8400-e29b-41d4-a716-446655440000',
          statusId: '550e8400-e29b-41d4-a716-446655440001',
        };

        const board = plainToClass(Board, boardData);
        const errors = await validate(board);

        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('title');
        expect(errors[0].constraints).toHaveProperty('maxLength');
        expect(errors[0].constraints?.maxLength).toBe(
          'Le titre du board ne peut pas dépasser 200 caractères',
        );
      });
    });

    describe('ownerId validation', () => {
      it('should fail when ownerId is empty', async () => {
        const boardData = {
          title: 'Test Board',
          ownerId: '',
          statusId: '550e8400-e29b-41d4-a716-446655440001',
        };

        const board = plainToClass(Board, boardData);
        const errors = await validate(board);

        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('ownerId');
        expect(errors[0].constraints).toHaveProperty('isNotEmpty');
      });
    });

    describe('statusId validation', () => {
      it('should fail when statusId is empty', async () => {
        const boardData = {
          title: 'Test Board',
          ownerId: '550e8400-e29b-41d4-a716-446655440000',
          statusId: '',
        };

        const board = plainToClass(Board, boardData);
        const errors = await validate(board);

        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('statusId');
        expect(errors[0].constraints).toHaveProperty('isNotEmpty');
      });
    });

    describe('backgroundColor validation', () => {
      it('should pass with valid hex color', async () => {
        const boardData = {
          title: 'Test Board',
          ownerId: '550e8400-e29b-41d4-a716-446655440000',
          statusId: '550e8400-e29b-41d4-a716-446655440001',
          backgroundColor: '#123ABC',
        };

        const board = plainToClass(Board, boardData);
        const errors = await validate(board);

        expect(errors).toHaveLength(0);
      });

      it('should fail with invalid hex color', async () => {
        const boardData = {
          title: 'Test Board',
          ownerId: '550e8400-e29b-41d4-a716-446655440000',
          statusId: '550e8400-e29b-41d4-a716-446655440001',
          backgroundColor: 'invalid-color',
        };

        const board = plainToClass(Board, boardData);
        const errors = await validate(board);

        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('backgroundColor');
        expect(errors[0].constraints).toHaveProperty('isHexColor');
        expect(errors[0].constraints?.isHexColor).toBe(
          'La couleur de fond doit être un code hexadécimal valide',
        );
      });
    });

    describe('description validation', () => {
      it('should pass with null description', async () => {
        const boardData = {
          title: 'Test Board',
          ownerId: '550e8400-e29b-41d4-a716-446655440000',
          statusId: '550e8400-e29b-41d4-a716-446655440001',
          description: null,
        };

        const board = plainToClass(Board, boardData);
        const errors = await validate(board);

        expect(errors).toHaveLength(0);
      });

      it('should pass with valid description', async () => {
        const boardData = {
          title: 'Test Board',
          ownerId: '550e8400-e29b-41d4-a716-446655440000',
          statusId: '550e8400-e29b-41d4-a716-446655440001',
          description: 'Une description valide pour le board',
        };

        const board = plainToClass(Board, boardData);
        const errors = await validate(board);

        expect(errors).toHaveLength(0);
      });
    });
  });

  describe('Entity Properties', () => {
    it('should have correct property types', () => {
      const board = new Board();

      board.title = 'Test Board';
      board.description = 'Test Description';
      board.ownerId = '550e8400-e29b-41d4-a716-446655440000';
      board.statusId = '550e8400-e29b-41d4-a716-446655440001';
      board.backgroundColor = '#FFFFFF';

      expect(typeof board.title).toBe('string');
      expect(typeof board.description).toBe('string');
      expect(typeof board.ownerId).toBe('string');
      expect(typeof board.statusId).toBe('string');
      expect(typeof board.backgroundColor).toBe('string');
    });

    it('should inherit from BaseEntity', () => {
      const board = new Board();

      // Propriétés héritées de BaseEntity
      expect(board).toHaveProperty('id');
      expect(board).toHaveProperty('createdAt');
      expect(board).toHaveProperty('updatedAt');
      expect(board).toHaveProperty('deletedAt');
      expect(board).toHaveProperty('deletedBy');
    });
  });
});
