import { TrackingWithoutSoftDeleteEntity } from 'src/common/entities/common';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Document } from './document.entity';
@Entity('send-history')
export class SendHistory extends TrackingWithoutSoftDeleteEntity {
  @PrimaryGeneratedColumn()
  id: number; // Unique identifier for the send history record

  @Index()
  @Column({ type: 'int' })
  documentId: number;
  @ManyToOne(() => Document, (document) => document.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'documentId' })
  document: Document; // Many-to-one relationship with Document

  @Index()
  @Column({ type: 'timestamp', nullable: true })
  sendAt: Date; // Timestamp indicating when the notification was sent

  @Index()
  @Column({ type: 'timestamp', nullable: true })
  scheduledTime: Date; // set sending time
}
