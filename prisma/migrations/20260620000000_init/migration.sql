-- CCB Matériaux — Migration initiale
-- Générée manuellement depuis prisma/schema.prisma
-- À appliquer via : npx prisma migrate deploy

-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE "ProductCategory" AS ENUM (
  'GROS_OEUVRE',
  'ETANCHEITE',
  'CARRELAGE',
  'PLOMBERIE',
  'ELECTRICITE',
  'SANITAIRES',
  'ELECTROMENAGER',
  'SOLAIRE'
);

CREATE TYPE "OrderStatus" AS ENUM (
  'PRE_CONFIRMED',
  'CONFIRMED',
  'IN_PREPARATION',
  'IN_DELIVERY',
  'DELIVERED',
  'CANCELLED'
);

CREATE TYPE "OrderChannel" AS ENUM (
  'WHATSAPP',
  'WEB',
  'MANUAL',
  'PHONE'
);

CREATE TYPE "LeadStatus" AS ENUM (
  'NEW',
  'CONTACTED',
  'QUOTE_SENT',
  'WON',
  'LOST'
);

CREATE TYPE "PaymentProvider" AS ENUM (
  'WAVE',
  'ORANGE_MONEY',
  'ON_DELIVERY'
);

CREATE TYPE "PaymentStatus" AS ENUM (
  'PENDING',
  'COMPLETED',
  'FAILED',
  'REFUNDED',
  'EXPIRED'
);

CREATE TYPE "UserRole" AS ENUM (
  'ADMIN',
  'COMMERCIAL'
);

-- ─── Tables (ordre de dépendance : sans FK en premier) ────────────────────────

CREATE TABLE "delivery_zones" (
    "id"          TEXT           NOT NULL,
    "name"        TEXT           NOT NULL,
    "description" TEXT,
    "base_fee"    DECIMAL(10,2)  NOT NULL,
    "per_km_fee"  DECIMAL(10,2),
    "is_active"   BOOLEAN        NOT NULL DEFAULT true,
    "created_at"  TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3)   NOT NULL,

    CONSTRAINT "delivery_zones_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_reps" (
    "id"               TEXT         NOT NULL,
    "name"             TEXT         NOT NULL,
    "whatsapp_number"  TEXT         NOT NULL,
    "email"            TEXT,
    "delivery_zone_id" TEXT,
    "is_active"        BOOLEAN      NOT NULL DEFAULT true,
    "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_reps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "users" (
    "id"            TEXT         NOT NULL,
    "email"         TEXT         NOT NULL,
    "password_hash" TEXT         NOT NULL,
    "name"          TEXT         NOT NULL,
    "role"          "UserRole"   NOT NULL DEFAULT 'COMMERCIAL',
    "is_active"     BOOLEAN      NOT NULL DEFAULT true,
    "sales_rep_id"  TEXT,
    "last_login_at" TIMESTAMP(3),
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "products" (
    "id"                  TEXT              NOT NULL,
    "name"                TEXT              NOT NULL,
    "slug"                TEXT              NOT NULL,
    "description"         TEXT,
    "category"            "ProductCategory" NOT NULL,
    "price"               DECIMAL(10,2)     NOT NULL,
    "stock_qty"           INTEGER           NOT NULL DEFAULT 0,
    "low_stock_threshold" INTEGER           NOT NULL DEFAULT 5,
    "image_url"           TEXT,
    "images"              TEXT[]            NOT NULL DEFAULT ARRAY[]::TEXT[],
    "unit"                TEXT              NOT NULL DEFAULT 'unité',
    "sku"                 TEXT,
    "brand"               TEXT,
    "is_active"           BOOLEAN           NOT NULL DEFAULT true,
    "external_ref"        TEXT,
    "last_synced_at"      TIMESTAMP(3),
    "created_at"          TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"          TIMESTAMP(3)      NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customers" (
    "id"              TEXT          NOT NULL,
    "whatsapp_number" TEXT          NOT NULL,
    "name"            TEXT,
    "email"           TEXT,
    "address"         TEXT,
    "city"            TEXT,
    "is_blocked"      BOOLEAN       NOT NULL DEFAULT false,
    "total_orders"    INTEGER       NOT NULL DEFAULT 0,
    "total_spent"     DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at"      TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3)  NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "orders" (
    "id"               TEXT           NOT NULL,
    "order_number"     TEXT           NOT NULL,
    "customer_id"      TEXT           NOT NULL,
    "delivery_zone_id" TEXT,
    "status"           "OrderStatus"  NOT NULL DEFAULT 'PRE_CONFIRMED',
    "channel"          "OrderChannel" NOT NULL,
    "subtotal"         DECIMAL(10,2)  NOT NULL,
    "delivery_fee"     DECIMAL(10,2)  NOT NULL DEFAULT 0,
    "discount"         DECIMAL(10,2)  NOT NULL DEFAULT 0,
    "total"            DECIMAL(10,2)  NOT NULL,
    "delivery_address" TEXT,
    "delivery_city"    TEXT,
    "notes"            TEXT,
    "cancel_reason"    TEXT,
    "confirmed_at"     TIMESTAMP(3),
    "delivered_at"     TIMESTAMP(3),
    "created_at"       TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"       TIMESTAMP(3)   NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_items" (
    "id"           TEXT          NOT NULL,
    "order_id"     TEXT          NOT NULL,
    "product_id"   TEXT          NOT NULL,
    "quantity"     INTEGER       NOT NULL,
    "unit_price"   DECIMAL(10,2) NOT NULL,
    "total_price"  DECIMAL(10,2) NOT NULL,
    "product_name" TEXT          NOT NULL,
    "product_sku"  TEXT,
    "unit"         TEXT          NOT NULL DEFAULT 'unité',

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "leads" (
    "id"              TEXT          NOT NULL,
    "customer_id"     TEXT,
    "whatsapp_number" TEXT,
    "name"            TEXT,
    "company"         TEXT,
    "status"          "LeadStatus"  NOT NULL DEFAULT 'NEW',
    "source"          TEXT,
    "notes"           TEXT,
    "estimated_value" DECIMAL(10,2),
    "won_at"          TIMESTAMP(3),
    "lost_at"         TIMESTAMP(3),
    "lost_reason"     TEXT,
    "created_at"      TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3)  NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lead_assignments" (
    "id"             TEXT         NOT NULL,
    "lead_id"        TEXT         NOT NULL,
    "sales_rep_id"   TEXT         NOT NULL,
    "assigned_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassigned_at"  TIMESTAMP(3),
    "is_current"     BOOLEAN      NOT NULL DEFAULT true,

    CONSTRAINT "lead_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payments" (
    "id"                  TEXT              NOT NULL,
    "order_id"            TEXT              NOT NULL,
    "provider"            "PaymentProvider" NOT NULL,
    "status"              "PaymentStatus"   NOT NULL DEFAULT 'PENDING',
    "amount"              DECIMAL(10,2)     NOT NULL,
    "currency"            TEXT              NOT NULL DEFAULT 'XOF',
    "transaction_ref"     TEXT,
    "provider_payment_id" TEXT,
    "payment_link"        TEXT,
    "failure_reason"      TEXT,
    "idempotency_key"     TEXT              NOT NULL,
    "webhook_payload"     JSONB,
    "paid_at"             TIMESTAMP(3),
    "created_at"          TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"          TIMESTAMP(3)      NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "loyalty_points" (
    "id"          TEXT         NOT NULL,
    "customer_id" TEXT         NOT NULL,
    "points"      INTEGER      NOT NULL,
    "reason"      TEXT         NOT NULL,
    "order_id"    TEXT,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_points_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_reviews" (
    "id"          TEXT         NOT NULL,
    "product_id"  TEXT         NOT NULL,
    "customer_id" TEXT         NOT NULL,
    "rating"      INTEGER      NOT NULL,
    "comment"     TEXT,
    "is_approved" BOOLEAN      NOT NULL DEFAULT false,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "conversation_states" (
    "id"              TEXT         NOT NULL,
    "customer_id"     TEXT,
    "whatsapp_number" TEXT         NOT NULL,
    "step"            TEXT         NOT NULL,
    "context"         JSONB        NOT NULL DEFAULT '{}',
    "expires_at"      TIMESTAMP(3) NOT NULL,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_states_pkey" PRIMARY KEY ("id")
);

-- ─── Contraintes d'unicité ────────────────────────────────────────────────────

CREATE UNIQUE INDEX "sales_reps_whatsapp_number_key" ON "sales_reps"("whatsapp_number");
CREATE UNIQUE INDEX "sales_reps_email_key"            ON "sales_reps"("email");

CREATE UNIQUE INDEX "users_email_key"        ON "users"("email");
CREATE UNIQUE INDEX "users_sales_rep_id_key" ON "users"("sales_rep_id");

CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");
CREATE UNIQUE INDEX "products_sku_key"  ON "products"("sku");

CREATE UNIQUE INDEX "customers_whatsapp_number_key" ON "customers"("whatsapp_number");
CREATE UNIQUE INDEX "customers_email_key"            ON "customers"("email");

CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

CREATE UNIQUE INDEX "payments_transaction_ref_key"  ON "payments"("transaction_ref");
CREATE UNIQUE INDEX "payments_idempotency_key_key"  ON "payments"("idempotency_key");

CREATE UNIQUE INDEX "product_reviews_product_id_customer_id_key"
    ON "product_reviews"("product_id", "customer_id");

-- ─── Index de recherche ───────────────────────────────────────────────────────

CREATE INDEX "sales_reps_whatsapp_number_idx" ON "sales_reps"("whatsapp_number");

CREATE INDEX "products_category_idx"            ON "products"("category");
CREATE INDEX "products_is_active_idx"           ON "products"("is_active");
CREATE INDEX "products_is_active_category_idx"  ON "products"("is_active", "category");
CREATE INDEX "products_slug_idx"                ON "products"("slug");

CREATE INDEX "customers_whatsapp_number_idx" ON "customers"("whatsapp_number");

CREATE INDEX "orders_status_idx"            ON "orders"("status");
CREATE INDEX "orders_channel_idx"           ON "orders"("channel");
CREATE INDEX "orders_customer_id_idx"       ON "orders"("customer_id");
CREATE INDEX "orders_created_at_idx"        ON "orders"("created_at");
CREATE INDEX "orders_status_channel_idx"    ON "orders"("status", "channel");
CREATE INDEX "orders_status_created_at_idx" ON "orders"("status", "created_at");

CREATE INDEX "order_items_order_id_idx"   ON "order_items"("order_id");
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");

CREATE INDEX "leads_status_idx"           ON "leads"("status");
CREATE INDEX "leads_whatsapp_number_idx"  ON "leads"("whatsapp_number");
CREATE INDEX "leads_customer_id_idx"      ON "leads"("customer_id");

CREATE INDEX "lead_assignments_lead_id_is_current_idx"
    ON "lead_assignments"("lead_id", "is_current");
CREATE INDEX "lead_assignments_sales_rep_id_is_current_idx"
    ON "lead_assignments"("sales_rep_id", "is_current");

CREATE INDEX "payments_order_id_idx"        ON "payments"("order_id");
CREATE INDEX "payments_status_idx"          ON "payments"("status");
CREATE INDEX "payments_transaction_ref_idx" ON "payments"("transaction_ref");

CREATE INDEX "loyalty_points_customer_id_idx" ON "loyalty_points"("customer_id");

CREATE INDEX "product_reviews_product_id_is_approved_idx"
    ON "product_reviews"("product_id", "is_approved");

CREATE INDEX "conversation_states_whatsapp_number_idx" ON "conversation_states"("whatsapp_number");
CREATE INDEX "conversation_states_expires_at_idx"      ON "conversation_states"("expires_at");

-- ─── Clés étrangères ─────────────────────────────────────────────────────────

ALTER TABLE "sales_reps"
    ADD CONSTRAINT "sales_reps_delivery_zone_id_fkey"
    FOREIGN KEY ("delivery_zone_id") REFERENCES "delivery_zones"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "users"
    ADD CONSTRAINT "users_sales_rep_id_fkey"
    FOREIGN KEY ("sales_rep_id") REFERENCES "sales_reps"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "orders"
    ADD CONSTRAINT "orders_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "orders"
    ADD CONSTRAINT "orders_delivery_zone_id_fkey"
    FOREIGN KEY ("delivery_zone_id") REFERENCES "delivery_zones"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "order_items"
    ADD CONSTRAINT "order_items_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_items"
    ADD CONSTRAINT "order_items_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "products"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "leads"
    ADD CONSTRAINT "leads_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "lead_assignments"
    ADD CONSTRAINT "lead_assignments_lead_id_fkey"
    FOREIGN KEY ("lead_id") REFERENCES "leads"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lead_assignments"
    ADD CONSTRAINT "lead_assignments_sales_rep_id_fkey"
    FOREIGN KEY ("sales_rep_id") REFERENCES "sales_reps"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payments"
    ADD CONSTRAINT "payments_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "loyalty_points"
    ADD CONSTRAINT "loyalty_points_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "product_reviews"
    ADD CONSTRAINT "product_reviews_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "products"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "product_reviews"
    ADD CONSTRAINT "product_reviews_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "conversation_states"
    ADD CONSTRAINT "conversation_states_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
