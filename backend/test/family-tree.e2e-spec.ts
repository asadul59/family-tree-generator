import { INestApplication } from '@nestjs/common';
import { Server } from 'node:http';
import request from 'supertest';
import { DataSource, Repository } from 'typeorm';
import { Person } from '../src/persons/entities/person.entity';
import { Tree } from '../src/trees/entities/tree.entity';
import { createTestApp, resetTestDatabase } from './test-app';

interface TreeResponse {
  id: string;
  name: string;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface PersonResponse {
  id: string;
  treeId: string;
  fullName: string;
  spouseName: string | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface HierarchyPersonResponse {
  id: string;
  fullName: string;
  spouseName: string | null;
  parentId: string | null;
  children: HierarchyPersonResponse[];
}

interface HierarchyResponse {
  id: string;
  name: string;
  members: HierarchyPersonResponse[];
  orphans: HierarchyPersonResponse[];
}

const MISSING_UUID = '00000000-0000-4000-8000-0000000000ff';

function treeBody(response: { body: unknown }): TreeResponse {
  return response.body as TreeResponse;
}

function personBody(response: { body: unknown }): PersonResponse {
  return response.body as PersonResponse;
}

function hierarchyBody(response: { body: unknown }): HierarchyResponse {
  return response.body as HierarchyResponse;
}

function countHierarchyNodes(people: HierarchyPersonResponse[]): number {
  return people.reduce(
    (count, person) => count + 1 + countHierarchyNodes(person.children),
    0,
  );
}

function hierarchyIds(people: HierarchyPersonResponse[]): string[] {
  return people.flatMap((person) => [
    person.id,
    ...hierarchyIds(person.children),
  ]);
}

describe('Family Tree API', () => {
  let app: INestApplication;
  let server: Server;
  let dataSource: DataSource;
  let treeRepository: Repository<Tree>;
  let personRepository: Repository<Person>;

  beforeAll(async () => {
    ({ app, dataSource } = await createTestApp());
    server = app.getHttpServer() as Server;
    treeRepository = dataSource.getRepository(Tree);
    personRepository = dataSource.getRepository(Person);
  });

  beforeEach(async () => {
    await resetTestDatabase(dataSource);
  });

  afterAll(async () => {
    await resetTestDatabase(dataSource);
    await app.close();
  });

  async function createTree(name: string): Promise<TreeResponse> {
    const response = await request(server)
      .post('/api/trees')
      .send({ name })
      .expect(201);
    return treeBody(response);
  }

  async function createPerson(
    treeId: string,
    fullName: string,
    options: { spouseName?: string; parentId?: string } = {},
  ): Promise<PersonResponse> {
    const response = await request(server)
      .post('/api/persons')
      .send({
        treeId,
        fullName,
        ...(options.spouseName === undefined
          ? {}
          : { spouseName: options.spouseName }),
        ...(options.parentId === undefined
          ? {}
          : { parentId: options.parentId }),
      })
      .expect(201);
    return personBody(response);
  }

  describe('tree API', () => {
    it('creates a tree and trims its name', async () => {
      const tree = await createTree('  My Family  ');

      expect(tree.name).toBe('My Family');
      expect(tree.id).toEqual(expect.any(String));
      expect(tree.createdAt).toEqual(expect.any(String));
      expect(tree.updatedAt).toEqual(expect.any(String));
    });

    it.each([
      ['missing name', {}],
      ['empty name', { name: '' }],
      ['whitespace name', { name: '   ' }],
      ['non-string name', { name: 123 }],
    ])('rejects %s', async (_label, payload) => {
      await request(server).post('/api/trees').send(payload).expect(400);
    });

    it('returns an empty list when no trees exist', async () => {
      const response = await request(server).get('/api/trees').expect(200);

      expect(response.body).toEqual([]);
    });

    it('returns newest trees first with lightweight member counts', async () => {
      const olderTree = await createTree('Older Tree');
      await new Promise((resolve) => setTimeout(resolve, 10));
      const newerTree = await createTree('Newer Tree');
      await createPerson(newerTree.id, 'Member One');

      const response = await request(server).get('/api/trees').expect(200);
      const trees = response.body as TreeResponse[];

      expect(trees[0]?.id).toBe(newerTree.id);
      expect(trees[0]?.memberCount).toBe(1);
      expect(trees[0]).not.toHaveProperty('persons');
      expect(trees[1]?.id).toBe(olderTree.id);
      expect(trees[1]?.memberCount).toBe(0);
    });

    it('gets tree metadata without returning the hierarchy', async () => {
      const tree = await createTree('Metadata Tree');
      await createPerson(tree.id, 'Metadata Member');

      const response = await request(server)
        .get(`/api/trees/${tree.id}`)
        .expect(200);
      const body = treeBody(response);

      expect(body.id).toBe(tree.id);
      expect(body.name).toBe('Metadata Tree');
      expect(body).not.toHaveProperty('members');
      expect(body).not.toHaveProperty('persons');
    });

    it('returns 404 for a nonexistent tree metadata request', async () => {
      await request(server).get(`/api/trees/${MISSING_UUID}`).expect(404);
    });

    it('renames a tree and trims the new name', async () => {
      const tree = await createTree('Old Name');

      const response = await request(server)
        .patch(`/api/trees/${tree.id}`)
        .send({ name: '  New Name  ' })
        .expect(200);

      expect(treeBody(response).name).toBe('New Name');
      const persisted = await treeRepository.findOneByOrFail({ id: tree.id });
      expect(persisted.name).toBe('New Name');
    });

    it.each([
      ['missing name', {}],
      ['empty name', { name: '' }],
      ['whitespace name', { name: '   ' }],
    ])('rejects renaming with %s', async (_label, payload) => {
      const tree = await createTree('Validation Tree');

      await request(server)
        .patch(`/api/trees/${tree.id}`)
        .send(payload)
        .expect(400);
    });

    it('returns 404 when renaming a nonexistent tree', async () => {
      await request(server)
        .patch(`/api/trees/${MISSING_UUID}`)
        .send({ name: 'Missing' })
        .expect(404);
    });

    it('deletes a tree and its people while preserving other trees', async () => {
      const treeA = await createTree('Delete A');
      const treeB = await createTree('Delete B');
      const aPerson = await createPerson(treeA.id, 'A Person');
      await createPerson(treeA.id, 'A Child', { parentId: aPerson.id });
      const bPerson = await createPerson(treeB.id, 'B Person');
      await createPerson(treeB.id, 'B Child', { parentId: bPerson.id });

      const response = await request(server)
        .delete(`/api/trees/${treeA.id}`)
        .expect(200);

      expect(response.body).toEqual({
        message: 'Family tree deleted successfully',
      });
      expect(
        await personRepository.count({ where: { treeId: treeA.id } }),
      ).toBe(0);
      expect(
        await personRepository.count({ where: { treeId: treeB.id } }),
      ).toBe(2);
      await request(server).get(`/api/trees/${treeA.id}`).expect(404);
    });

    it('deletes an empty tree', async () => {
      const tree = await createTree('Empty Tree');

      await request(server).delete(`/api/trees/${tree.id}`).expect(200);

      expect(await treeRepository.count({ where: { id: tree.id } })).toBe(0);
    });

    it('returns 404 when deleting a nonexistent tree', async () => {
      await request(server).delete(`/api/trees/${MISSING_UUID}`).expect(404);
    });
  });

  describe('person API', () => {
    it('creates a root person with and without a spouse', async () => {
      const tree = await createTree('People Tree');
      const withSpouse = await createPerson(tree.id, 'John Doe', {
        spouseName: 'Jane Doe',
      });
      const withoutSpouse = await createPerson(tree.id, 'Solo Person');

      expect(withSpouse.treeId).toBe(tree.id);
      expect(withSpouse.parentId).toBeNull();
      expect(withSpouse.spouseName).toBe('Jane Doe');
      expect(withoutSpouse.spouseName).toBeNull();
    });

    const invalidPersonPayloads: Array<
      [string, (treeId: string) => Record<string, unknown>]
    > = [
      ['missing treeId', () => ({ fullName: 'Missing Tree' })],
      [
        'invalid treeId',
        () => ({ treeId: 'not-a-uuid', fullName: 'Invalid Tree' }),
      ],
      ['missing fullName', (treeId) => ({ treeId })],
      ['empty fullName', (treeId) => ({ treeId, fullName: '' })],
      ['whitespace fullName', (treeId) => ({ treeId, fullName: '   ' })],
      [
        'invalid parentId',
        (treeId) => ({
          treeId,
          fullName: 'Bad Parent',
          parentId: 'not-a-uuid',
        }),
      ],
    ];

    it.each(invalidPersonPayloads)(
      'rejects person creation with %s',
      async (_label, buildPayload) => {
        const tree = await createTree('Person Validation Tree');

        await request(server)
          .post('/api/persons')
          .send(buildPayload(tree.id))
          .expect(400);
      },
    );

    it('returns 404 for a nonexistent tree', async () => {
      await request(server)
        .post('/api/persons')
        .send({ treeId: MISSING_UUID, fullName: 'Missing Tree' })
        .expect(404);
    });

    it('creates a child with a valid same-tree parent', async () => {
      const tree = await createTree('Parent Tree');
      const parent = await createPerson(tree.id, 'Parent');
      const child = await createPerson(tree.id, 'Child', {
        parentId: parent.id,
      });

      expect(child.parentId).toBe(parent.id);
    });

    it('returns 404 for a nonexistent parent', async () => {
      const tree = await createTree('Missing Parent Tree');

      await request(server)
        .post('/api/persons')
        .send({ treeId: tree.id, fullName: 'Child', parentId: MISSING_UUID })
        .expect(404);
    });

    it('rejects a parent from another tree', async () => {
      const treeA = await createTree('Tree A');
      const treeB = await createTree('Tree B');
      const parent = await createPerson(treeB.id, 'Other Tree Parent');

      await request(server)
        .post('/api/persons')
        .send({ treeId: treeA.id, fullName: 'Child', parentId: parent.id })
        .expect(400);
    });
  });

  describe('batch children API', () => {
    async function createBatch(
      treeId: string,
      parentId: string,
      children: Array<{ fullName: string; spouseName?: string }>,
    ) {
      return request(server)
        .post('/api/persons/batch')
        .send({ treeId, parentId, children })
        .expect(201);
    }

    it('creates one and multiple children under the same parent', async () => {
      const tree = await createTree('Batch Tree');
      const parent = await createPerson(tree.id, 'Batch Parent');

      const oneResponse = await createBatch(tree.id, parent.id, [
        { fullName: 'Only Child' },
      ]);
      expect(
        (oneResponse.body as { children: PersonResponse[] }).children,
      ).toHaveLength(1);

      const manyResponse = await createBatch(tree.id, parent.id, [
        { fullName: 'Child One', spouseName: 'Spouse One' },
        { fullName: 'Child Two' },
        { fullName: 'Child Three' },
      ]);
      const children = (manyResponse.body as { children: PersonResponse[] })
        .children;
      expect(children).toHaveLength(3);
      expect(children.every((child) => child.parentId === parent.id)).toBe(
        true,
      );
    });

    it('rejects an empty children array', async () => {
      const tree = await createTree('Empty Batch Tree');
      const parent = await createPerson(tree.id, 'Parent');

      await request(server)
        .post('/api/persons/batch')
        .send({ treeId: tree.id, parentId: parent.id, children: [] })
        .expect(400);
    });

    it('rejects invalid tree, parent, and child data', async () => {
      const tree = await createTree('Invalid Batch Tree');
      const otherTree = await createTree('Other Batch Tree');
      const parent = await createPerson(tree.id, 'Parent');
      const otherParent = await createPerson(otherTree.id, 'Other Parent');

      await request(server)
        .post('/api/persons/batch')
        .send({
          treeId: 'not-a-uuid',
          parentId: parent.id,
          children: [{ fullName: 'Child' }],
        })
        .expect(400);
      await request(server)
        .post('/api/persons/batch')
        .send({
          treeId: tree.id,
          parentId: MISSING_UUID,
          children: [{ fullName: 'Child' }],
        })
        .expect(404);
      await request(server)
        .post('/api/persons/batch')
        .send({
          treeId: tree.id,
          parentId: otherParent.id,
          children: [{ fullName: 'Child' }],
        })
        .expect(400);
      await request(server)
        .post('/api/persons/batch')
        .send({
          treeId: tree.id,
          parentId: parent.id,
          children: [{ fullName: '' }],
        })
        .expect(400);
    });

    it('rolls back all children when one child fails', async () => {
      const tree = await createTree('Rollback Tree');
      const parent = await createPerson(tree.id, 'Rollback Parent');
      const oversizedName = 'X'.repeat(300);

      await request(server)
        .post('/api/persons/batch')
        .send({
          treeId: tree.id,
          parentId: parent.id,
          children: [
            { fullName: 'Will Roll Back One' },
            { fullName: 'Will Roll Back Two' },
            { fullName: oversizedName },
          ],
        })
        .expect(500);

      expect(
        await personRepository.count({ where: { parentId: parent.id } }),
      ).toBe(0);
    });
  });

  describe('hierarchy API', () => {
    it('returns an empty hierarchy for an empty tree', async () => {
      const tree = await createTree('Empty Hierarchy');

      const response = await request(server)
        .get(`/api/trees/${tree.id}/hierarchy`)
        .expect(200);

      expect(hierarchyBody(response).members).toEqual([]);
      expect(hierarchyBody(response).orphans).toEqual([]);
    });

    it('returns one root and nested generations', async () => {
      const tree = await createTree('Hierarchy Tree');
      const root = await createPerson(tree.id, 'John', {
        spouseName: 'Jane',
      });
      const michael = await createPerson(tree.id, 'Michael', {
        parentId: root.id,
      });
      const alex = await createPerson(tree.id, 'Alex', {
        parentId: michael.id,
      });
      const david = await createPerson(tree.id, 'David', {
        parentId: root.id,
      });

      const response = await request(server)
        .get(`/api/trees/${tree.id}/hierarchy`)
        .expect(200);
      const hierarchy = hierarchyBody(response);
      const rootNode = hierarchy.members[0];

      expect(rootNode?.id).toBe(root.id);
      expect(rootNode?.spouseName).toBe('Jane');
      expect(rootNode?.children.map((child) => child.id)).toEqual([
        michael.id,
        david.id,
      ]);
      expect(rootNode?.children[0]?.children[0]?.id).toBe(alex.id);
      expect(countHierarchyNodes(hierarchy.members)).toBe(4);
      expect(new Set(hierarchyIds(hierarchy.members)).size).toBe(4);
    });

    it('returns multiple roots', async () => {
      const tree = await createTree('Multiple Roots');
      const first = await createPerson(tree.id, 'First Root');
      const second = await createPerson(tree.id, 'Second Root');

      const response = await request(server)
        .get(`/api/trees/${tree.id}/hierarchy`)
        .expect(200);
      const hierarchy = hierarchyBody(response);

      expect(hierarchy.members.map((member) => member.id)).toEqual([
        first.id,
        second.id,
      ]);
    });

    it('never includes people from another tree', async () => {
      const tree = await createTree('Scoped Tree');
      const otherTree = await createTree('Other Scoped Tree');
      const local = await createPerson(tree.id, 'Local Person');
      const other = await createPerson(otherTree.id, 'Other Person');

      const response = await request(server)
        .get(`/api/trees/${tree.id}/hierarchy`)
        .expect(200);
      const hierarchy = hierarchyBody(response);

      expect(hierarchyIds(hierarchy.members)).toEqual([local.id]);
      expect(hierarchyIds(hierarchy.orphans)).not.toContain(other.id);
    });

    it('returns 404 for a missing tree', async () => {
      await request(server)
        .get(`/api/trees/${MISSING_UUID}/hierarchy`)
        .expect(404);
    });

    it('does not crash on a cross-tree parent reference', async () => {
      const tree = await createTree('Orphan Tree');
      const otherTree = await createTree('Orphan Other Tree');
      const person = await createPerson(tree.id, 'Orphaned Person');
      const otherPerson = await createPerson(otherTree.id, 'Other Parent');
      await personRepository.update(person.id, { parentId: otherPerson.id });

      const response = await request(server)
        .get(`/api/trees/${tree.id}/hierarchy`)
        .expect(200);
      const hierarchy = hierarchyBody(response);

      expect(hierarchy.members).toEqual([]);
      expect(hierarchyIds(hierarchy.orphans)).toEqual([person.id]);
    });

    it('does not crash on a corrupted cycle', async () => {
      const tree = await createTree('Cycle Tree');
      const first = await createPerson(tree.id, 'Cycle One');
      const second = await createPerson(tree.id, 'Cycle Two');
      await personRepository.update(first.id, { parentId: second.id });
      await personRepository.update(second.id, { parentId: first.id });

      const response = await request(server)
        .get(`/api/trees/${tree.id}/hierarchy`)
        .expect(200);
      const hierarchy = hierarchyBody(response);

      expect(
        countHierarchyNodes(hierarchy.members) +
          countHierarchyNodes(hierarchy.orphans),
      ).toBe(2);
    });
  });

  describe('person edit and delete API', () => {
    it('updates fullName, spouseName, and both', async () => {
      const tree = await createTree('Edit Tree');
      const person = await createPerson(tree.id, 'Original', {
        spouseName: 'Original Spouse',
      });

      const nameResponse = await request(server)
        .patch(`/api/persons/${person.id}`)
        .send({ fullName: 'New Name' })
        .expect(200);
      expect(personBody(nameResponse).fullName).toBe('New Name');
      expect(personBody(nameResponse).spouseName).toBe('Original Spouse');

      const spouseResponse = await request(server)
        .patch(`/api/persons/${person.id}`)
        .send({ spouseName: 'New Spouse' })
        .expect(400);

      expect(spouseResponse.status).toBe(400);

      const bothResponse = await request(server)
        .patch(`/api/persons/${person.id}`)
        .send({ fullName: 'Final Name', spouseName: 'Final Spouse' })
        .expect(200);
      expect(personBody(bothResponse).fullName).toBe('Final Name');
      expect(personBody(bothResponse).spouseName).toBe('Final Spouse');
    });

    it('rejects empty person updates and missing people', async () => {
      const tree = await createTree('Edit Validation Tree');
      const person = await createPerson(tree.id, 'Person');

      await request(server)
        .patch(`/api/persons/${person.id}`)
        .send({ fullName: '   ' })
        .expect(400);
      await request(server)
        .patch(`/api/persons/${MISSING_UUID}`)
        .send({ fullName: 'Missing' })
        .expect(404);
    });

    it('does not change treeId or parentId during an edit', async () => {
      const treeA = await createTree('Immutable A');
      const treeB = await createTree('Immutable B');
      const parent = await createPerson(treeA.id, 'Parent');
      const person = await createPerson(treeA.id, 'Person', {
        parentId: parent.id,
      });

      const response = await request(server)
        .patch(`/api/persons/${person.id}`)
        .send({
          fullName: 'Updated',
          treeId: treeB.id,
          parentId: MISSING_UUID,
        })
        .expect(200);
      const updated = personBody(response);

      expect(updated.treeId).toBe(treeA.id);
      expect(updated.parentId).toBe(parent.id);
    });

    it('deletes a leaf person', async () => {
      const tree = await createTree('Delete Person Tree');
      const person = await createPerson(tree.id, 'Leaf');

      await request(server).delete(`/api/persons/${person.id}`).expect(204);

      expect(await personRepository.count({ where: { id: person.id } })).toBe(
        0,
      );
    });

    it('rejects deleting a person with children without changing data', async () => {
      const tree = await createTree('Delete Parent Tree');
      const parent = await createPerson(tree.id, 'Parent');
      const child = await createPerson(tree.id, 'Child', {
        parentId: parent.id,
      });

      await request(server).delete(`/api/persons/${parent.id}`).expect(409);

      expect(await personRepository.count({ where: { id: parent.id } })).toBe(
        1,
      );
      expect(await personRepository.count({ where: { id: child.id } })).toBe(1);
    });

    it('deletes a root person without children', async () => {
      const tree = await createTree('Delete Root Tree');
      const root = await createPerson(tree.id, 'Root');

      await request(server).delete(`/api/persons/${root.id}`).expect(204);

      expect(await personRepository.count({ where: { id: root.id } })).toBe(0);
      expect(await treeRepository.count({ where: { id: tree.id } })).toBe(1);
    });

    it('returns 404 when deleting a nonexistent person', async () => {
      await request(server).delete(`/api/persons/${MISSING_UUID}`).expect(404);
    });
  });

  describe('move/re-parent API', () => {
    it('moves a person to a sibling branch', async () => {
      const tree = await createTree('Move Sibling Tree');
      const john = await createPerson(tree.id, 'John');
      const michael = await createPerson(tree.id, 'Michael', {
        parentId: john.id,
      });
      const david = await createPerson(tree.id, 'David', {
        parentId: john.id,
      });

      await request(server)
        .patch(`/api/persons/${michael.id}/parent`)
        .send({ parentId: david.id })
        .expect(200);

      const response = await request(server)
        .get(`/api/trees/${tree.id}/hierarchy`)
        .expect(200);
      const hierarchy = hierarchyBody(response);
      const johnNode = hierarchy.members[0];
      const davidNode = johnNode?.children.find(
        (child) => child.id === david.id,
      );

      expect(davidNode?.children.map((child) => child.id)).toEqual([
        michael.id,
      ]);
    });

    it('moves a person to root', async () => {
      const tree = await createTree('Move Root Tree');
      const john = await createPerson(tree.id, 'John');
      const michael = await createPerson(tree.id, 'Michael', {
        parentId: john.id,
      });

      await request(server)
        .patch(`/api/persons/${michael.id}/parent`)
        .send({ parentId: null })
        .expect(200);

      const response = await request(server)
        .get(`/api/trees/${tree.id}/hierarchy`)
        .expect(200);
      expect(hierarchyBody(response).members).toHaveLength(2);
    });

    it('moves a person to another valid branch', async () => {
      const tree = await createTree('Move Branch Tree');
      const john = await createPerson(tree.id, 'John');
      const michael = await createPerson(tree.id, 'Michael', {
        parentId: john.id,
      });
      const alex = await createPerson(tree.id, 'Alex', {
        parentId: michael.id,
      });
      const david = await createPerson(tree.id, 'David', {
        parentId: john.id,
      });
      const emma = await createPerson(tree.id, 'Emma', {
        parentId: david.id,
      });

      await request(server)
        .patch(`/api/persons/${alex.id}/parent`)
        .send({ parentId: emma.id })
        .expect(200);

      const response = await request(server)
        .get(`/api/trees/${tree.id}/hierarchy`)
        .expect(200);
      const ids = hierarchyIds(hierarchyBody(response).members);
      expect(ids).toContain(alex.id);
      expect(ids).toHaveLength(5);
    });

    it('rejects self-parenting and descendant cycles', async () => {
      const tree = await createTree('Cycle Move Tree');
      const john = await createPerson(tree.id, 'John');
      const michael = await createPerson(tree.id, 'Michael', {
        parentId: john.id,
      });
      const alex = await createPerson(tree.id, 'Alex', {
        parentId: michael.id,
      });

      await request(server)
        .patch(`/api/persons/${alex.id}/parent`)
        .send({ parentId: alex.id })
        .expect(400);
      await request(server)
        .patch(`/api/persons/${john.id}/parent`)
        .send({ parentId: alex.id })
        .expect(400);
    });

    it('rejects cross-tree and missing parents', async () => {
      const treeA = await createTree('Move Tree A');
      const treeB = await createTree('Move Tree B');
      const person = await createPerson(treeA.id, 'Person A');
      const otherParent = await createPerson(treeB.id, 'Parent B');

      await request(server)
        .patch(`/api/persons/${person.id}/parent`)
        .send({ parentId: otherParent.id })
        .expect(400);
      await request(server)
        .patch(`/api/persons/${person.id}/parent`)
        .send({ parentId: MISSING_UUID })
        .expect(404);
      await request(server)
        .patch(`/api/persons/${MISSING_UUID}/parent`)
        .send({ parentId: person.id })
        .expect(404);
    });
  });

  describe('database integrity', () => {
    it('uses UUIDs for trees and people', async () => {
      const tree = await createTree('UUID Tree');
      const person = await createPerson(tree.id, 'UUID Person');
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(tree.id).toMatch(uuidPattern);
      expect(person.id).toMatch(uuidPattern);
      expect(person.treeId).toBe(tree.id);
    });

    it('keeps parent relationships inside the same tree', async () => {
      const treeA = await createTree('Integrity A');
      const treeB = await createTree('Integrity B');
      const parentA = await createPerson(treeA.id, 'Parent A');
      const child = await createPerson(treeA.id, 'Child A', {
        parentId: parentA.id,
      });

      expect(child.treeId).toBe(treeA.id);
      expect(parentA.treeId).toBe(treeA.id);
      expect((await treeRepository.findOneByOrFail({ id: treeB.id })).id).toBe(
        treeB.id,
      );
    });
  });
});
