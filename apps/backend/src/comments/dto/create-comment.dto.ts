import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsNumber()
  @Min(1)
  startLine: number;

  @IsNumber()
  @Min(1)
  endLine: number;

  @IsString()
  @IsOptional()
  author?: string;
}
