import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BoardRole } from '../common/role.enum';

@Entity()
export class BoardMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  boardId: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: BoardRole,
  })
  role: BoardRole;
}
