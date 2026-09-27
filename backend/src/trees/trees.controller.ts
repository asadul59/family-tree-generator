import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateTreeDto } from './dto/create-tree.dto';
import { UpdateTreeDto } from './dto/update-tree.dto';
import { Tree } from './entities/tree.entity';
import { TreeHierarchyResponse } from './interfaces/tree-hierarchy.interface';
import { TreeSummary } from './interfaces/tree-list.interface';
import { TreesService } from './trees.service';

@Controller('trees')
export class TreesController {
  constructor(private readonly treesService: TreesService) {}

  @Post()
  create(@Body() createTreeDto: CreateTreeDto): Promise<Tree> {
    return this.treesService.create(createTreeDto);
  }

  @Get()
  findAll(): Promise<TreeSummary[]> {
    return this.treesService.findAll();
  }

  @Get(':id/hierarchy')
  getHierarchy(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<TreeHierarchyResponse> {
    return this.treesService.getHierarchy(id);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<Tree> {
    return this.treesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateTreeDto: UpdateTreeDto,
  ): Promise<Tree> {
    return this.treesService.update(id, updateTreeDto);
  }

  @Delete(':id')
  remove(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<{ message: string }> {
    return this.treesService.remove(id);
  }
}
