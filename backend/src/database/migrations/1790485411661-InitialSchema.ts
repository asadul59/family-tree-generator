import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1790485411661 implements MigrationInterface {
  name = 'InitialSchema1790485411661';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "trees" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_916905d3ddf29a431776817cd8d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "persons" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "treeId" uuid NOT NULL, "fullName" character varying(255) NOT NULL, "spouseName" character varying(255), "parentId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_74278d8812a049233ce41440ac7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "persons" ADD CONSTRAINT "FK_ca52665d21b0516a76eced7c5a8" FOREIGN KEY ("treeId") REFERENCES "trees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "persons" ADD CONSTRAINT "FK_1641ea9b270622efcf5a843d6f3" FOREIGN KEY ("parentId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "persons" DROP CONSTRAINT "FK_1641ea9b270622efcf5a843d6f3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "persons" DROP CONSTRAINT "FK_ca52665d21b0516a76eced7c5a8"`,
    );
    await queryRunner.query(`DROP TABLE "persons"`);
    await queryRunner.query(`DROP TABLE "trees"`);
  }
}
