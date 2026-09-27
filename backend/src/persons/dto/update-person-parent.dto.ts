import { IsDefined, IsUUID, ValidateIf } from 'class-validator';

export class UpdatePersonParentDto {
  @IsDefined()
  @ValidateIf((_object: unknown, value: unknown) => value !== null)
  @IsUUID()
  parentId!: string | null;
}
