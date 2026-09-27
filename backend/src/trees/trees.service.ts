import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Person } from '../persons/entities/person.entity';
import { CreateTreeDto } from './dto/create-tree.dto';
import { UpdateTreeDto } from './dto/update-tree.dto';
import { Tree } from './entities/tree.entity';
import {
  TreeHierarchyPerson,
  TreeHierarchyResponse,
} from './interfaces/tree-hierarchy.interface';
import { TreeSummary } from './interfaces/tree-list.interface';

interface TreeSummaryRow {
  id: string;
  name: string;
  memberCount: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class TreesService {
  constructor(
    @InjectRepository(Tree)
    private readonly treesRepository: Repository<Tree>,
    @InjectRepository(Person)
    private readonly personsRepository: Repository<Person>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  create(createTreeDto: CreateTreeDto): Promise<Tree> {
    const tree = this.treesRepository.create({
      name: createTreeDto.name,
    });

    return this.treesRepository.save(tree);
  }

  async findAll(): Promise<TreeSummary[]> {
    const rows = await this.treesRepository
      .createQueryBuilder('tree')
      .leftJoin('tree.persons', 'person')
      .select('tree.id', 'id')
      .addSelect('tree.name', 'name')
      .addSelect('tree.createdAt', 'createdAt')
      .addSelect('tree.updatedAt', 'updatedAt')
      .addSelect('COUNT(person.id)', 'memberCount')
      .groupBy('tree.id')
      .orderBy('tree.createdAt', 'DESC')
      .getRawMany<TreeSummaryRow>();

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      memberCount: Number(row.memberCount),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async findOne(treeId: string): Promise<Tree> {
    const tree = await this.treesRepository.findOneBy({ id: treeId });

    if (!tree) {
      throw new NotFoundException(`Tree with id "${treeId}" was not found.`);
    }

    return tree;
  }

  async update(treeId: string, updateTreeDto: UpdateTreeDto): Promise<Tree> {
    const tree = await this.findOne(treeId);
    tree.name = updateTreeDto.name;

    return this.treesRepository.save(tree);
  }

  async remove(treeId: string): Promise<{ message: string }> {
    const tree = await this.findOne(treeId);

    await this.dataSource.transaction(async (manager) => {
      await manager.remove(Tree, tree);
    });

    return { message: 'Family tree deleted successfully' };
  }

  async getHierarchy(treeId: string): Promise<TreeHierarchyResponse> {
    const tree = await this.findOne(treeId);

    const persons = await this.personsRepository.find({
      where: { treeId },
      order: { createdAt: 'ASC' },
    });

    const personsById = new Map<string, Person>();
    const childIdsByParent = new Map<string, string[]>();
    const rootIds: string[] = [];
    const orphanIds: string[] = [];

    for (const person of persons) {
      personsById.set(person.id, person);
    }

    for (const person of persons) {
      if (person.parentId === null) {
        rootIds.push(person.id);
        continue;
      }

      if (!personsById.has(person.parentId)) {
        orphanIds.push(person.id);
        continue;
      }

      const childIds = childIdsByParent.get(person.parentId) ?? [];
      childIds.push(person.id);
      childIdsByParent.set(person.parentId, childIds);
    }

    const visited = new Set<string>();

    const buildNode = (
      personId: string,
      ancestors: Set<string>,
    ): TreeHierarchyPerson | null => {
      if (ancestors.has(personId) || visited.has(personId)) {
        return null;
      }

      const person = personsById.get(personId);

      if (!person) {
        return null;
      }

      visited.add(personId);
      ancestors.add(personId);

      const children: TreeHierarchyPerson[] = [];

      for (const childId of childIdsByParent.get(personId) ?? []) {
        const child = buildNode(childId, ancestors);

        if (child) {
          children.push(child);
        }
      }

      ancestors.delete(personId);

      return {
        id: person.id,
        fullName: person.fullName,
        spouseName: person.spouseName,
        parentId: person.parentId,
        children,
      };
    };

    const members = rootIds
      .map((personId) => buildNode(personId, new Set<string>()))
      .filter((person): person is TreeHierarchyPerson => person !== null);

    const orphans = orphanIds
      .map((personId) => buildNode(personId, new Set<string>()))
      .filter((person): person is TreeHierarchyPerson => person !== null);

    for (const person of persons) {
      if (visited.has(person.id)) {
        continue;
      }

      const orphan = buildNode(person.id, new Set<string>());

      if (orphan) {
        orphans.push(orphan);
      }
    }

    return {
      id: tree.id,
      name: tree.name,
      members,
      orphans,
    };
  }
}
