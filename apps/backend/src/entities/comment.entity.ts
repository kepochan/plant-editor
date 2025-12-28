import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Diagram } from './diagram.entity';

@Entity('comments')
@Index(['diagram'])
@Index(['diagram', 'processedInVersion'])
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Diagram, (diagram) => diagram.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'diagram_id' })
  diagram: Diagram;

  @Column({ name: 'diagram_id' })
  diagramId: string;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'int', name: 'start_line' })
  startLine: number;

  @Column({ type: 'int', name: 'end_line' })
  endLine: number;

  @Column({ type: 'text', name: 'code_snapshot' })
  codeSnapshot: string;

  @Column({ length: 255, nullable: true })
  author: string;

  @Column({ type: 'boolean', default: false })
  processed: boolean;

  @Column({ type: 'int', name: 'processed_in_version', nullable: true })
  processedInVersion: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
