import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductImageUrl1700000000001 implements MigrationInterface {
  name = 'AddProductImageUrl1700000000001';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN "image_url" varchar(500) NOT NULL DEFAULT ''`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "products" DROP COLUMN "image_url"');
  }
}
