import { Document } from './document.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm';
import { Notification } from './notification.entity';
import { User } from './user.entity';

@Entity('document-recipient')
export class DocumentRecipient {
  @PrimaryGeneratedColumn()
  id: number; // Unique identifier for the document recipient

  @Index()
  @Column({ type: 'int' })
  notificationId: number; // ID of the associated notification
  @ManyToOne(() => Notification, (n) => n.recipients, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'notificationId' })
  notification: Notification; // Many-to-one relationship with Notification entity

  @Column({ type: 'int' })
  userId: number; // ID of the user who received the notification
  @ManyToOne(() => User, (u) => u.documentRecipients, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User; // User entity representing the recipient of the notification

  @Index()
  @Column({ type: 'timestamp', nullable: true, default: null })
  readAt: Date | null; // NULL = unread, NOT NULL = read
}
