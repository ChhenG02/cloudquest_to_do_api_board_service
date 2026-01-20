import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { BoardsService } from "./boards.service";
import { InternalGuard } from "./internal.guard";

@UseGuards(InternalGuard)
@Controller("internal/boards")
export class InternalBoardController {
  constructor(private readonly boardService: BoardsService) {}

  @Get(":boardId/permission")
  async getPermission(
    @Param("boardId") boardId: string,
    @Query("userId") userId: string
  ) {
    const role = await this.boardService.getUserRole(boardId, userId);
    return { boardId, userId, role };
  }
}
