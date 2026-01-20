import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Board } from './board.entity';
import { BoardMember } from './board-member.entity';
import { BoardRole } from '../common/role.enum';

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board)
    private boardRepo: Repository<Board>,
    @InjectRepository(BoardMember)
    private memberRepo: Repository<BoardMember>,
  ) {}

  async createBoard(name: string, userId: string) {
    const board = await this.boardRepo.save({
      name,
      ownerId: userId,
    });

    await this.memberRepo.save({
      boardId: board.id,
      userId,
      role: BoardRole.OWNER,
    });

    return board;
  }

  async getBoards(userId: string) {
    const memberships = await this.memberRepo.find({ where: { userId } });
    const boardIds = memberships.map(m => m.boardId);

    // typeorm v0.3+ prefers find({ where: { id: In(boardIds) } })
    // but your code uses findByIds, keep it if it works in your version.
    return this.boardRepo.findByIds(boardIds);
  }

  // ✅ View detail (member can view)
  async getBoardDetail(boardId: string, userId: string) {
    // must be member (OWNER/MEMBER/ADMIN etc)
    await this.checkPermission(boardId, userId, [
      BoardRole.OWNER,
      BoardRole.EDITOR,
      BoardRole.VIEWER,
    ]); 

    const board = await this.boardRepo.findOne({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Board not found');

    // optional: include members list
    const members = await this.memberRepo.find({ where: { boardId } });

    return { ...board, members };
  }

  async shareBoard(
    boardId: string,
    ownerId: string,
    targetUserId: string,
    role: BoardRole,
  ) {
    const board = await this.boardRepo.findOne({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Board not found');

    if (board.ownerId !== ownerId)
      throw new ForbiddenException('Only owner can share');

    const existingMembers = await this.memberRepo.find({ where: { boardId } });

    if (existingMembers.length > 1)
      throw new ForbiddenException('Board already shared');

    return this.memberRepo.save({
      boardId,
      userId: targetUserId,
      role,
    });
  }

  async checkPermission(
    boardId: string,
    userId: string,
    allowedRoles: BoardRole[],
  ) {
    const member = await this.memberRepo.findOne({
      where: { boardId, userId },
    });

    if (!member || !allowedRoles.includes(member.role))
      throw new ForbiddenException('Permission denied');

    return true;
  }

  // ✅ Update board name (OWNER only)
  async updateBoard(boardId: string, userId: string, name: string) {
    if (!name || !name.trim()) {
      throw new BadRequestException('Name is required');
    }

    const board = await this.boardRepo.findOne({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Board not found');

    if (board.ownerId !== userId) {
      throw new ForbiddenException('Only owner can update');
    }

    board.name = name.trim();
    await this.boardRepo.save(board);

    return board;
  }

  async deleteBoard(boardId: string, userId: string) {
    const board = await this.boardRepo.findOne({ where: { id: boardId } });
    if (!board) throw new NotFoundException();

    if (board.ownerId !== userId)
      throw new ForbiddenException('Only owner can delete');

    await this.memberRepo.delete({ boardId });
    await this.boardRepo.delete(boardId);
    return { message: 'Board deleted' };
  }
}
