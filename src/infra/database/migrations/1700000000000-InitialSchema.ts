import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" uuid PRIMARY KEY,
        "name" varchar(150) NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "active" boolean NOT NULL DEFAULT true,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid PRIMARY KEY,
        "name" varchar(200) NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "price_cents" bigint NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'BRL',
        "stock" integer NOT NULL DEFAULT 0,
        "category_id" uuid NOT NULL,
        "sku" varchar(80) NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query('CREATE INDEX "idx_products_category" ON "products" ("category_id")');
    await queryRunner.query('CREATE UNIQUE INDEX "idx_products_sku" ON "products" ("sku")');
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid PRIMARY KEY,
        "customer_id" uuid NOT NULL,
        "total_cents" bigint NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'BRL',
        "status" varchar(30) NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query('CREATE INDEX "idx_orders_customer" ON "orders" ("customer_id")');
    await queryRunner.query('CREATE INDEX "idx_orders_status" ON "orders" ("status")');
    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id" uuid PRIMARY KEY,
        "order_id" uuid NOT NULL REFERENCES "orders" ("id") ON DELETE CASCADE,
        "product_id" uuid NOT NULL,
        "product_name" varchar(200) NOT NULL,
        "quantity" integer NOT NULL,
        "unit_price_cents" bigint NOT NULL,
        "subtotal_cents" bigint NOT NULL
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" uuid PRIMARY KEY,
        "order_id" uuid NOT NULL,
        "amount_cents" bigint NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'BRL',
        "method" varchar(20) NOT NULL,
        "status" varchar(20) NOT NULL,
        "transaction_id" varchar,
        "paid_at" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query('CREATE INDEX "idx_payments_order" ON "payments" ("order_id")');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "payments"');
    await queryRunner.query('DROP TABLE "order_items"');
    await queryRunner.query('DROP TABLE "orders"');
    await queryRunner.query('DROP TABLE "products"');
    await queryRunner.query('DROP TABLE "categories"');
  }
}
