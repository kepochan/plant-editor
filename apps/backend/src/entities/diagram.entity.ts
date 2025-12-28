import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { DiagramVersion } from './diagram-version.entity';
import { Comment } from './comment.entity';

@Entity('diagrams')
export class Diagram {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, default: 'Sans titre' })
  name: string;

  @Column({ type: 'text', default: '' })
  currentCode: string;

  @Column({ type: 'int', default: 0 })
  currentVersion: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => DiagramVersion, (version) => version.diagram, {
    cascade: true,
  })
  versions: DiagramVersion[];

  @OneToMany(() => Comment, (comment) => comment.diagram, {
    cascade: true,
  })
  comments: Comment[];
}
