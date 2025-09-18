import { TrackingWithoutSoftDeleteEntity } from 'src/common/entities/common';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DocumentRecipient } from './documment-recipient.entity';

@Entity('notification')
export class Notification extends TrackingWithoutSoftDeleteEntity {
  @PrimaryGeneratedColumn()
  id: number; // Unique identifier for the notification

  @Column({ type: 'varchar', length: 191 })
  name: string; // Name of the notification

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  body: string; // Body of the notification

  @OneToMany(() => DocumentRecipient, (doc) => doc.notification, {
    cascade: ['insert', 'remove'],
  })
  recipients: DocumentRecipient[]; // Array of notification recipients associated with this notification
}
