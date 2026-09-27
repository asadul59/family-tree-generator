import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Person } from '../persons/entities/person.entity';
import { Tree } from './entities/tree.entity';
import { TreesController } from './trees.controller';
import { TreesService } from './trees.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tree, Person])],
  controllers: [TreesController],
  providers: [TreesService],
})
export class TreesModule {}
