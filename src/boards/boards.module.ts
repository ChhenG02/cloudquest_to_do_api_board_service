import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Board } from './board.entity';
import { BoardMember } from './board-member.entity';
import { BoardsService } from './boards.service';
import { BoardsController } from './boards.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Board, BoardMember])],
  providers: [BoardsService],
  controllers: [BoardsController],
})
export class BoardsModule {}
