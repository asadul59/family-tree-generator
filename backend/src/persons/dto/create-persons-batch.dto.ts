import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsUUID, ValidateNested } from 'class-validator';
import { CreateChildDto } from './create-child.dto';

export class CreatePersonsBatchDto {
  @IsUUID()
  treeId!: string;

  @IsUUID()
  parentId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateChildDto)
  children!: CreateChildDto[];
}
