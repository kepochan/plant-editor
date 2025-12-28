import { IsString, IsNotEmpty } from 'class-validator';

export class CreateDiagramDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  sessionId: string;
}
