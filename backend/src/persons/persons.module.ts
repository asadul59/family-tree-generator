import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tree } from '../trees/entities/tree.entity';
import { Person } from './entities/person.entity';
import { PersonsController } from './persons.controller';
import { PersonsService } from './persons.service';

@Module({
  imports: [TypeOrmModule.forFeature([Person, Tree])],
  controllers: [PersonsController],
  providers: [PersonsService],
})
export class PersonsModule {}
