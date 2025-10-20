/**
 * 🏗️ **Common Entity Base Classes - Reusable audit và tracking patterns**
 *
 * **File Purpose:** Định nghĩa các base class cho audit trail và data tracking
 *
 * **Architecture Pattern:** Composition-based inheritance hierarchy
 *
 * **Available Base Classes:**
 * 1. `PersonEntity` - User action tracking (creator/editor)
 * 2. `TrackingWithoutSoftDeleteEntity` - Timestamp tracking only
 * 3. `TrackingEntity` - Timestamp + soft delete
 * 4. `PersonWithTrackingEntity` - Full audit + soft delete
 * 5. `PersonWithTrackingWithoutSoftDeleteEntity` - Full audit without soft delete
 *
 * **Usage Guide:**
 * - Extend `PersonEntity` - Chỉ cần track user actions
 * - Extend `TrackingWithoutSoftDeleteEntity` - Chỉ cần timestamp
 * - Extend `TrackingEntity` - Cần timestamp + soft delete
 * - Extend `PersonWithTrackingEntity` - Cần full audit + soft delete (most common)
 * - Extend `PersonWithTrackingWithoutSoftDeleteEntity` - Cần full audit, hard delete
 */

// TODO: Update the import path below if the User entity is located elsewhere
import { User } from 'src/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 👤 **PersonEntity - Base class cho audit tracking user actions**
 *
 * **Chức năng:** Track ai tạo và ai chỉnh sửa entity
 *
 * **Fields included:**
 * - `creatorId: number` - ID của user tạo record
 * - `creator: User` - Relation đến User entity (người tạo)
 * - `editorId: number` - ID của user chỉnh sửa record lần cuối
 * - `editor: User` - Relation đến User entity (người chỉnh sửa cuối)
 *
 * **Database Relations:**
 * - ManyToOne với User entity cho creator
 * - ManyToOne với User entity cho editor
 * - onDelete: 'SET NULL' - Không xóa record khi user bị xóa
 *
 * **Use Cases:**
 * - Audit logging cho tất cả entity cần track user actions
 * - Compliance và security tracking
 * - Business logic cần biết ai thực hiện thao tác
 */
export class PersonEntity {
  @Column({ type: 'int', nullable: true })
  creatorId: number; // ID người tạo record

  @ManyToOne((): typeof User => User, {
    nullable: true,
    onDelete: 'SET NULL', // Giữ record khi user bị xóa
    onUpdate: 'SET NULL',
  })
  @JoinColumn({ name: 'creatorId' })
  creator: User; // Relation đến User entity (người tạo)

  @Column({ type: 'int', nullable: true })
  editorId: number; // ID người chỉnh sửa lần cuối

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'SET NULL', // Giữ record khi user bị xóa
    onUpdate: 'SET NULL',
  })
  @JoinColumn({ name: 'editorId' })
  editor: User; // Relation đến User entity (người chỉnh sửa cuối)
}

/**
 * ⏰ **TrackingWithoutSoftDeleteEntity - Base class cho timestamp tracking**
 *
 * **Chức năng:** Track thời gian tạo và cập nhật record (không có soft delete)
 *
 * **Fields included:**
 * - `updatedAt: Date` - Timestamp lần cập nhật cuối cùng
 * - `createdAt: Date` - Timestamp khi record được tạo
 *
 * **Database Features:**
 * - Auto-update updatedAt khi record thay đổi
 * - Auto-set createdAt khi record được tạo
 * - Precision 6 microseconds cho timestamp
 *
 * **Use Cases:**
 * - Entity không cần soft delete
 * - Simple audit trail chỉ cần timestamp
 * - Performance-critical tables không cần full audit
 */
export class TrackingWithoutSoftDeleteEntity {
  @UpdateDateColumn({
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)', // Tự động update khi record thay đổi
  })
  updatedAt: Date; // Thời gian cập nhật cuối cùng

  @CreateDateColumn({
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP(6)', // Tự động set khi tạo record
  })
  createdAt: Date; // Thời gian tạo record
}

/**
 * 🗑️ **TrackingEntity - Base class cho timestamp tracking với soft delete**
 *
 * **Chức năng:** Extends TrackingWithoutSoftDeleteEntity + thêm soft delete capability
 *
 * **Fields included:**
 * - `updatedAt: Date` - (inherited) Timestamp lần cập nhật cuối cùng
 * - `createdAt: Date` - (inherited) Timestamp khi record được tạo
 * - `deletedAt?: Date` - Timestamp khi record bị soft delete (null = chưa xóa)
 *
 * **Soft Delete Features:**
 * - Record không bị xóa vật lý khỏi database
 * - Set deletedAt timestamp khi "xóa"
 * - TypeORM tự động filter record có deletedAt != null
 *
 * **Use Cases:**
 * - Entity cần khôi phục sau khi xóa
 * - Audit trail yêu cầu giữ lại data
 * - Business logic cần access deleted records
 */
export class TrackingEntity extends TrackingWithoutSoftDeleteEntity {
  @DeleteDateColumn({ type: 'timestamp', nullable: true, default: null })
  deletedAt?: Date; // Timestamp soft delete (null = chưa xóa)
}
/**
 * 👤⏰🗑️ **PersonWithTrackingEntity - Full audit tracking với soft delete**
 *
 * **Chức năng:** Kết hợp PersonEntity + timestamp tracking + soft delete
 *
 * **Fields included:**
 * - `creatorId: number` - (inherited) ID người tạo record
 * - `creator: User` - (inherited) Relation đến User entity (người tạo)
 * - `editorId: number` - (inherited) ID người chỉnh sửa lần cuối
 * - `editor: User` - (inherited) Relation đến User entity (người chỉnh sửa cuối)
 * - `deletedAt?: Date` - Timestamp soft delete (null = chưa xóa)
 * - `updatedAt: Date` - Timestamp lần cập nhật cuối cùng
 * - `createdAt: Date` - Timestamp khi record được tạo
 *
 * **Complete Audit Features:**
 * - User tracking (ai tạo, ai sửa)
 * - Timestamp tracking (khi tạo, khi sửa)
 * - Soft delete (khi xóa, có thể khôi phục)
 *
 * **Use Cases:**
 * - Entity yêu cầu full audit trail
 * - Business-critical data cần track đầy đủ
 * - Compliance requirements cao
 * - Entity có workflow phức tạp
 */
export class PersonWithTrackingEntity extends PersonEntity {
  @DeleteDateColumn({ type: 'timestamp', nullable: true, default: null })
  deletedAt?: Date; // Timestamp soft delete (null = chưa xóa)

  @UpdateDateColumn({
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)', // Tự động update khi record thay đổi
  })
  updatedAt: Date; // Thời gian cập nhật cuối cùng

  @CreateDateColumn({
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP(6)', // Tự động set khi tạo record
  })
  createdAt: Date; // Thời gian tạo record
}

/**
 * 👤⏰ **PersonWithTrackingWithoutSoftDeleteEntity - Full audit không soft delete**
 *
 * **Chức năng:** Kết hợp PersonEntity + timestamp tracking (không có soft delete)
 *
 * **Fields included:**
 * - `creatorId: number` - (inherited) ID người tạo record
 * - `creator: User` - (inherited) Relation đến User entity (người tạo)
 * - `editorId: number` - (inherited) ID người chỉnh sửa lần cuối
 * - `editor: User` - (inherited) Relation đến User entity (người chỉnh sửa cuối)
 * - `updatedAt: Date` - Timestamp lần cập nhật cuối cùng
 * - `createdAt: Date` - Timestamp khi record được tạo
 *
 * **Audit Features:**
 * - User tracking (ai tạo, ai sửa)
 * - Timestamp tracking (khi tạo, khi sửa)
 * - Hard delete (record bị xóa vĩnh viễn)
 *
 * **Use Cases:**
 * - Entity cần audit nhưng không cần khôi phục
 * - Data có lifecycle ngắn
 * - Performance requirements cao (không cần soft delete overhead)
 * - Storage constraints (không muốn giữ deleted records)
 */
export class PersonWithTrackingWithoutSoftDeleteEntity extends PersonEntity {
  @UpdateDateColumn({
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)', // Tự động update khi record thay đổi
  })
  updatedAt: Date; // Thời gian cập nhật cuối cùng

  @CreateDateColumn({
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP(6)', // Tự động set khi tạo record
  })
  createdAt: Date; // Thời gian tạo record
}
