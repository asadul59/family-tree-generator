import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tree } from '../../trees/entities/tree.entity';

@Entity('persons')
export class Person {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'treeId', type: 'uuid' })
  treeId!: string;

  @Column({ name: 'fullName', type: 'varchar', length: 255 })
  fullName!: string;

  @Column({
    name: 'spouseName',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  spouseName!: string | null;

  @Column({ name: 'parentId', type: 'uuid', nullable: true })
  parentId!: string | null;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt', type: 'timestamp' })
  updatedAt!: Date;

  @ManyToOne(() => Tree, (tree) => tree.persons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'treeId' })
  tree!: Tree;

  @ManyToOne(() => Person, (person) => person.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parentId' })
  parent!: Person | null;

  @OneToMany(() => Person, (person) => person.parent)
  children!: Person[];
}
