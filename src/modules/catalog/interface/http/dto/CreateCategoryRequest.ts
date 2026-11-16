import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCategoryRequest {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
