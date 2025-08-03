import { ApiProperty } from '@nestjs/swagger';

interface AnalysisContent {
  id: string;
  title: string;
  status: string;
  linkedFileIds?: string[];
  createdAt: string;
  updatedAt: string;
}

interface BoardOwner {
  id: string;
  displayName: string;
  isActive: boolean;
}

interface BoardStatus {
  id: string;
  category: string;
  name: string;
  isActive: boolean;
}

interface BoardMember {
  id: string;
  user: {
    id: string;
    displayName: string;
    isActive: boolean;
  };
  permissionLevel: string;
  status: {
    id: string;
    category: string;
    name: string;
    isActive: boolean;
  };
}

export class BoardFullResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty() description: string;
  @ApiProperty() backgroundColor: string;
  @ApiProperty() owner: BoardOwner;
  @ApiProperty() status: BoardStatus;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;

  @ApiProperty({ type: [Object] }) members: BoardMember[];
  @ApiProperty({ type: [Object] }) superBlocks: unknown[];
  @ApiProperty({ type: [Object] }) blocks: unknown[];
  @ApiProperty({
    type: [Object],
    description: "Contenus d'analyse liés aux blocks",
  })
  analysisContents: AnalysisContent[];
}
