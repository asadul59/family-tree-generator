import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreatePersonDto } from './dto/create-person.dto';
import { CreatePersonsBatchDto } from './dto/create-persons-batch.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { UpdatePersonParentDto } from './dto/update-person-parent.dto';
import { Person } from './entities/person.entity';
import { PersonsService } from './persons.service';

@Controller('persons')
export class PersonsController {
  constructor(private readonly personsService: PersonsService) {}

  @Post()
  create(@Body() createPersonDto: CreatePersonDto): Promise<Person> {
    return this.personsService.create(createPersonDto);
  }

  @Post('batch')
  createBatch(
    @Body() createPersonsBatchDto: CreatePersonsBatchDto,
  ): Promise<{ parentId: string; children: Person[] }> {
    return this.personsService.createBatch(createPersonsBatchDto);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updatePersonDto: UpdatePersonDto,
  ): Promise<Person> {
    return this.personsService.update(id, updatePersonDto);
  }

  @Patch(':id/parent')
  updateParent(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updatePersonParentDto: UpdatePersonParentDto,
  ): Promise<Person> {
    return this.personsService.updateParent(id, updatePersonParentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.personsService.remove(id);
  }
}
