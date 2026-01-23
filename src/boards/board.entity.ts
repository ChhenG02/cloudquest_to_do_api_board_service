import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Board {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  ownerId: string;

  @Column({ type: 'enum', enum: ['personal', 'team'], default: 'personal' })
  type: 'personal' | 'team';
}
