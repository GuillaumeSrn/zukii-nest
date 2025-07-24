import { ApiProperty } from '@nestjs/swagger';

export class BoardFullResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty() description: string;
  @ApiProperty() backgroundColor: string;
  @ApiProperty() owner: any;
  @ApiProperty() status: any;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;

  @ApiProperty({ type: [Object] }) members: any[];
  @ApiProperty({ type: [Object] }) superBlocks: any[];
  @ApiProperty({ type: [Object] }) blocks: any[];
}
