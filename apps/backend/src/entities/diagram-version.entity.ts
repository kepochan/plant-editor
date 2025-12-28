import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Diagram } from './diagram.entity';

@Entity('diagram_versions')
@Unique(['diagram', 'versionNumber'])
@Index(['diagram', 'versionNumber'])
export class DiagramVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Diagram, (diagram) => diagram.versions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'diagram_id' })
  diagram: Diagram;

  @Column({ name: 'diagram_id' })
  diagramId: string;

  @Column({ type: 'int', name: 'version_number' })
  versionNumber: number;

  @Column({ type: 'text' })
  code: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
