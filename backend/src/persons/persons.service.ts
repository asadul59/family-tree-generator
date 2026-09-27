import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Tree } from '../trees/entities/tree.entity';
import { CreatePersonDto } from './dto/create-person.dto';
import { CreatePersonsBatchDto } from './dto/create-persons-batch.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { UpdatePersonParentDto } from './dto/update-person-parent.dto';
import { Person } from './entities/person.entity';

@Injectable()
export class PersonsService {
  constructor(
    @InjectRepository(Person)
    private readonly personsRepository: Repository<Person>,
    @InjectRepository(Tree)
    private readonly treesRepository: Repository<Tree>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(createPersonDto: CreatePersonDto): Promise<Person> {
    const tree = await this.treesRepository.findOneBy({
      id: createPersonDto.treeId,
    });

    if (!tree) {
      throw new NotFoundException(
        `Tree with id "${createPersonDto.treeId}" was not found.`,
      );
    }

    let parentId: string | null = null;

    if (createPersonDto.parentId) {
      const parent = await this.personsRepository.findOneBy({
        id: createPersonDto.parentId,
      });

      if (!parent) {
        throw new NotFoundException(
          `Parent person with id "${createPersonDto.parentId}" was not found.`,
        );
      }

      if (parent.treeId !== tree.id) {
        throw new BadRequestException(
          'The parent person must belong to the same family tree.',
        );
      }

      parentId = parent.id;
    }

    const person = this.personsRepository.create({
      treeId: tree.id,
      fullName: createPersonDto.fullName,
      spouseName: createPersonDto.spouseName ?? null,
      parentId,
    });

    return this.personsRepository.save(person);
  }

  async update(
    personId: string,
    updatePersonDto: UpdatePersonDto,
  ): Promise<Person> {
    const person = await this.personsRepository.findOneBy({ id: personId });

    if (!person) {
      throw new NotFoundException(
        `Person with id "${personId}" was not found.`,
      );
    }

    person.fullName = updatePersonDto.fullName;

    if (updatePersonDto.spouseName !== undefined) {
      person.spouseName = updatePersonDto.spouseName;
    }

    return this.personsRepository.save(person);
  }

  async remove(personId: string): Promise<void> {
    const person = await this.personsRepository.findOneBy({ id: personId });

    if (!person) {
      throw new NotFoundException(
        `Person with id "${personId}" was not found.`,
      );
    }

    const childrenCount = await this.personsRepository.count({
      where: { parentId: person.id },
    });

    if (childrenCount > 0) {
      throw new ConflictException(
        `Cannot delete ${person.fullName} because they have children.`,
      );
    }

    await this.personsRepository.remove(person);
  }

  async updateParent(
    personId: string,
    updatePersonParentDto: UpdatePersonParentDto,
  ): Promise<Person> {
    const person = await this.personsRepository.findOneBy({ id: personId });

    if (!person) {
      throw new NotFoundException(
        `Person with id "${personId}" was not found.`,
      );
    }

    if (updatePersonParentDto.parentId === null) {
      person.parentId = null;
      return this.personsRepository.save(person);
    }

    if (updatePersonParentDto.parentId === person.id) {
      throw new BadRequestException('A person cannot be their own parent.');
    }

    const newParent = await this.personsRepository.findOneBy({
      id: updatePersonParentDto.parentId,
    });

    if (!newParent) {
      throw new NotFoundException(
        `Parent person with id "${updatePersonParentDto.parentId}" was not found.`,
      );
    }

    if (newParent.treeId !== person.treeId) {
      throw new BadRequestException(
        'The new parent must belong to the same family tree.',
      );
    }

    await this.assertMoveDoesNotCreateCycle(person, newParent);

    person.parentId = newParent.id;
    return this.personsRepository.save(person);
  }

  private async assertMoveDoesNotCreateCycle(
    person: Person,
    proposedParent: Person,
  ): Promise<void> {
    const visited = new Set<string>();
    let currentParentId: string | null = proposedParent.id;
    let currentParent: Person | null = proposedParent;

    while (currentParentId) {
      if (currentParentId === person.id) {
        throw new BadRequestException(
          'This move would create an invalid family hierarchy.',
        );
      }

      if (visited.has(currentParentId)) {
        return;
      }

      visited.add(currentParentId);
      currentParentId = currentParent?.parentId ?? null;

      if (currentParentId) {
        currentParent = await this.personsRepository.findOneBy({
          id: currentParentId,
        });
      }
    }
  }

  async createBatch(
    createPersonsBatchDto: CreatePersonsBatchDto,
  ): Promise<{ parentId: string; children: Person[] }> {
    return this.dataSource.transaction(async (manager) => {
      const tree = await manager.findOneBy(Tree, {
        id: createPersonsBatchDto.treeId,
      });

      if (!tree) {
        throw new NotFoundException(
          `Tree with id "${createPersonsBatchDto.treeId}" was not found.`,
        );
      }

      const parent = await manager.findOneBy(Person, {
        id: createPersonsBatchDto.parentId,
      });

      if (!parent) {
        throw new NotFoundException(
          `Parent person with id "${createPersonsBatchDto.parentId}" was not found.`,
        );
      }

      if (parent.treeId !== tree.id) {
        throw new BadRequestException(
          'The parent person must belong to the same family tree.',
        );
      }

      const children = createPersonsBatchDto.children.map((child) =>
        manager.create(Person, {
          treeId: tree.id,
          fullName: child.fullName,
          spouseName: child.spouseName ?? null,
          parentId: parent.id,
        }),
      );

      const savedChildren = await manager.save(Person, children);

      return {
        parentId: parent.id,
        children: savedChildren,
      };
    });
  }
}
