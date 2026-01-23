import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Param,
  Body,
  Req,
} from '@nestjs/common';
import { BoardsService } from './boards.service';
import { BoardRole } from '../common/role.enum';

@Controller('boards')
export class BoardsController {
  constructor(private boardsService: BoardsService) {}

  @Post()
  create(@Body('name') name: string, @Req() req) {
    return this.boardsService.createBoard(name, req.headers['x-user-id']);
  }

  @Get()
  getAll(@Req() req) {
    return this.boardsService.getBoards(req.headers['x-user-id']);
  }

  // ✅ View detail
  @Get(':id')
  getDetail(@Param('id') boardId: string, @Req() req) {
    return this.boardsService.getBoardDetail(boardId, req.headers['x-user-id']);
  }

  @Post(':id/share')
  share(
    @Param('id') boardId: string,
    @Body('userId') userId: string,
    @Body('role') role: BoardRole,
    @Req() req,
  ) {
    return this.boardsService.shareBoard(
      boardId,
      req.headers['x-user-id'],
      userId,
      role,
    );
  }

  // ✅ Update board (name)
  @Patch(':id')
  update(@Param('id') boardId: string, @Body('name') name: string, @Req() req) {
    return this.boardsService.updateBoard(boardId, req.headers['x-user-id'], name);
  }

  @Delete(':id')
  delete(@Param('id') boardId: string, @Req() req) {
    return this.boardsService.deleteBoard(boardId, req.headers['x-user-id']);
  }

  @Get(":id/members")
getMembers(@Param("id") boardId: string, @Req() req) {
  return this.boardsService.getMembers(boardId, req.headers["x-user-id"]);
}


@Patch(":id/members/:memberUserId")
updateMemberRole(
  @Param("id") boardId: string,
  @Param("memberUserId") memberUserId: string,
  @Body("role") role: BoardRole,
  @Req() req
) {
  return this.boardsService.updateMemberRole(boardId, req.headers["x-user-id"], memberUserId, role);
}

@Delete(":id/members/:memberUserId")
removeMember(
  @Param("id") boardId: string,
  @Param("memberUserId") memberUserId: string,
  @Req() req
) {
  return this.boardsService.removeMember(boardId, req.headers["x-user-id"], memberUserId);
}
@Get(":id/role")
getMyRole(@Param("id") boardId: string, @Req() req) {
  return this.boardsService.getUserRole(boardId, req.headers["x-user-id"]);
}

}
