import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async onModuleInit() {
    await this.seedRoles();
  }

  private async seedRoles() {
    const rolesToSeed = [
      {
        name: 'admin',
        description: 'Administrateur système avec tous les droits',
      },
      {
        name: 'user',
        description: 'Utilisateur standard',
      },
    ];

    for (const roleData of rolesToSeed) {
      const exists = await this.roleRepository.findOne({
        where: { name: roleData.name },
      });

      if (!exists) {
        const role = this.roleRepository.create(roleData);
        await this.roleRepository.save(role);
      }
    }
  }

  async findByName(name: string): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { name, deletedAt: IsNull() },
    });
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({
      where: { deletedAt: IsNull() },
      order: { name: 'ASC' },
    });
  }
}
