import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class InternalGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const key = req.headers["x-internal-key"];
    if (key !== process.env.INTERNAL_KEY) throw new UnauthorizedException();
    return true;
  }
}
