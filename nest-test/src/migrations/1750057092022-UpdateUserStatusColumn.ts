import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserStatusColumn1750057092022 implements MigrationInterface {
  name = 'UpdateUserStatusColumn1750057092022';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`user\` (\`creatorId\` int NULL, \`editorId\` int NULL, \`deletedAt\` timestamp(6) NULL, \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`id\` int NOT NULL AUTO_INCREMENT, \`username\` varchar(50) NOT NULL, \`email\` varchar(191) NOT NULL, \`role\` enum ('ADMINISTRATOR', 'COMPANY_ADMIN', 'HUMAN_RESOURCES', 'EMPLOYEE', 'CUSTOMER', 'CUSTOMER_VIP1', 'CUSTOMER_VIP2', 'CUSTOMER_VIP3') NOT NULL DEFAULT 'CUSTOMER', \`status\` enum ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED', 'PENDING', 'BLOCKED') NOT NULL DEFAULT 'ACTIVE', \`registrationType\` enum ('REGISTER_YOURSELF', 'COMPANY_ISSUED', 'ADMIN_ISSUED') NOT NULL DEFAULT 'COMPANY_ISSUED', \`password\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_78a916df40e02a9deb1c4b75ed\` (\`username\`), UNIQUE INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD CONSTRAINT \`FK_b40ff13132b995b758b1187ee8a\` FOREIGN KEY (\`creatorId\`) REFERENCES \`user\`(\`id\`) ON DELETE SET NULL ON UPDATE SET NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD CONSTRAINT \`FK_86e51ca6946e57aaac318b4f5a5\` FOREIGN KEY (\`editorId\`) REFERENCES \`user\`(\`id\`) ON DELETE SET NULL ON UPDATE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user\` DROP FOREIGN KEY \`FK_86e51ca6946e57aaac318b4f5a5\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` DROP FOREIGN KEY \`FK_b40ff13132b995b758b1187ee8a\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` ON \`user\``,
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_78a916df40e02a9deb1c4b75ed\` ON \`user\``,
    );
    await queryRunner.query(`DROP TABLE \`user\``);
  }
}
