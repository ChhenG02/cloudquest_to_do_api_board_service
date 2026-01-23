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
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board)
    private boardRepo: Repository<Board>,
    @InjectRepository(BoardMember)
    private memberRepo: Repository<BoardMember>,
    private readonly http: HttpService,
  ) {}

  async getUserRole(
    boardId: string,
    userId: string,
  ): Promise<BoardRole | 'NONE'> {
    const member = await this.memberRepo.findOne({
      where: { boardId, userId },
    });

    return member?.role ?? 'NONE';
  }

  async canWrite(boardId: string, userId: string): Promise<boolean> {
    const role = await this.getUserRole(boardId, userId);
    return role === BoardRole.OWNER || role === BoardRole.EDITOR;
  }

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
    const boardIds = memberships.map((m) => m.boardId);

    return this.boardRepo.findByIds(boardIds);
  }

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

  async getMembers(boardId: string, userId: string) {
  await this.checkPermission(boardId, userId, [BoardRole.OWNER, BoardRole.EDITOR, BoardRole.VIEWER]);
  return this.memberRepo.find({ where: { boardId } });
}


async updateMemberRole(boardId: string, ownerId: string, memberUserId: string, role: BoardRole) {
  const board = await this.boardRepo.findOne({ where: { id: boardId } });
  if (!board) throw new NotFoundException("Board not found");
  if (board.ownerId !== ownerId) throw new ForbiddenException("Only owner can change roles");
  if (memberUserId === ownerId) throw new BadRequestException("Owner role cannot be changed");

  const member = await this.memberRepo.findOne({ where: { boardId, userId: memberUserId } });
  if (!member) throw new NotFoundException("Member not found");

  member.role = role;
  await this.memberRepo.save(member);
  return { message: "Role updated" };
}

async removeMember(boardId: string, ownerId: string, memberUserId: string) {
  const board = await this.boardRepo.findOne({ where: { id: boardId } });
  if (!board) throw new NotFoundException("Board not found");
  if (board.ownerId !== ownerId) throw new ForbiddenException("Only owner can remove members");
  if (memberUserId === ownerId) throw new BadRequestException("Owner cannot be removed");

  await this.memberRepo.delete({ boardId, userId: memberUserId });

  // if only owner remains, set back to personal
  const remaining = await this.memberRepo.count({ where: { boardId } });
  if (remaining <= 1) {
    board.type = "personal";
    await this.boardRepo.save(board);
  }

  return { message: "Member removed" };
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

    if (targetUserId === ownerId)
      throw new BadRequestException('Owner already has access');

    // upsert membership (avoid duplicates)
    const existing = await this.memberRepo.findOne({
      where: { boardId, userId: targetUserId },
    });
    if (existing) {
      existing.role = role;
      await this.memberRepo.save(existing);
    } else {
      await this.memberRepo.save({ boardId, userId: targetUserId, role });
    }

    // mark board as team once shared
    if (board.type !== 'team') {
      board.type = 'team';
      await this.boardRepo.save(board);
    }

    return { message: 'Shared', boardId, userId: targetUserId, role };
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

    // 1) delete board + members
    await this.memberRepo.delete({ boardId });
    await this.boardRepo.delete(boardId);

    // 2) delete tasks in task-service by boardId
    try {
      await firstValueFrom(
        this.http.delete(`http://task-service:3003/tasks/board/${boardId}`),
      );
    } catch (e) {
      console.error('Failed to delete tasks for board:', boardId, e);
    }

    return { message: 'Board deleted', boardId };
  }
}
