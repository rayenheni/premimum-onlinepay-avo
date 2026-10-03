import { boolean, customType, integer, pgTable, primaryKey, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({ dataType() { return "bytea"; } });

/** One tenant = one lawyer's website. Every client-visible record is tenant-scoped. */
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 60 }).notNull().unique(),
  nameAr: varchar("name_ar", { length: 200 }).notNull(),
  nameFr: varchar("name_fr", { length: 200 }).notNull(),
  /** Custom domain (cabinet-xyz.tn) or platform subdomain (cabinet-xyz.plateforme.tn). */
  domain: varchar("domain", { length: 190 }).unique(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  plan: varchar("plan", { length: 40 }).notNull().default("standard"),
  adminEmail: varchar("admin_email", { length: 180 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const consultationRequests = pgTable("consultation_requests", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().default(1).references(() => tenants.id, { onDelete: "cascade" }),
  reference: varchar("reference", { length: 24 }).notNull().unique(),
  fullName: varchar("full_name", { length: 140 }).notNull(),
  email: varchar("email", { length: 180 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  service: varchar("service", { length: 120 }).notNull(),
  preferredDate: varchar("preferred_date", { length: 40 }),
  preferredTime: varchar("preferred_time", { length: 10 }),
  message: text("message"),
  locale: varchar("locale", { length: 5 }).notNull().default("ar"),
  paymentMethod: varchar("payment_method", { length: 40 }).notNull(),
  amount: integer("amount").notNull().default(90),
  /** Client-supplied proof for bank transfer and D17 payments (transaction code / reference). */
  paymentReference: varchar("payment_reference", { length: 120 }),
  paymentProofNote: text("payment_proof_note"),
  proofSubmittedAt: timestamp("proof_submitted_at", { withTimezone: true }),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  status: varchar("status", { length: 30 }).notNull().default("awaiting_confirmation"),
  gatewayReference: varchar("gateway_reference", { length: 80 }).unique(),
  paymentUrl: text("payment_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cabinetInquiries = pgTable("cabinet_inquiries", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().default(1).references(() => tenants.id, { onDelete: "cascade" }),
  reference: varchar("reference", { length: 24 }).notNull().unique(),
  kind: varchar("kind", { length: 20 }).notNull().default("contact"),
  fullName: varchar("full_name", { length: 140 }).notNull(),
  email: varchar("email", { length: 180 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  subject: varchar("subject", { length: 160 }),
  message: text("message").notNull(),
  locale: varchar("locale", { length: 5 }).notNull().default("ar"),
  status: varchar("status", { length: 20 }).notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().default(1).references(() => tenants.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 180 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  isPlatform: boolean("is_platform").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminSessions = pgTable("admin_sessions", {
  id: serial("id").primaryKey(),
  tokenHash: varchar("token_hash", { length: 64 }).notNull().unique(),
  adminId: integer("admin_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().default(1).references(() => tenants.id, { onDelete: "cascade" }),
  adminId: integer("admin_id"),
  action: varchar("action", { length: 80 }).notNull(),
  target: varchar("target", { length: 180 }),
  details: varchar("details", { length: 4000 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contentRevisions = pgTable("content_revisions", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().default(1).references(() => tenants.id, { onDelete: "cascade" }),
  locale: varchar("locale", { length: 5 }).notNull(),
  data: text("data").notNull(),
  adminId: integer("admin_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().default(1).references(() => tenants.id, { onDelete: "cascade" }),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  categoryAr: varchar("category_ar", { length: 120 }),
  categoryFr: varchar("category_fr", { length: 120 }),
  titleAr: varchar("title_ar", { length: 220 }),
  titleFr: varchar("title_fr", { length: 220 }),
  excerptAr: text("excerpt_ar"),
  excerptFr: text("excerpt_fr"),
  bodyAr: text("body_ar"),
  bodyFr: text("body_fr"),
  image: varchar("image", { length: 300 }).notNull().default("/images/article-family.jpg"),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cmsPages = pgTable("cms_pages", {
  tenantId: integer("tenant_id").notNull().default(1).references(() => tenants.id, { onDelete: "cascade" }),
  key: varchar("key", { length: 40 }).notNull(),
  enabled: boolean("enabled").notNull().default(true),
  showInNav: boolean("show_in_nav").notNull().default(true),
  metaTitleAr: varchar("meta_title_ar", { length: 220 }),
  metaTitleFr: varchar("meta_title_fr", { length: 220 }),
  metaDescriptionAr: text("meta_description_ar"),
  metaDescriptionFr: text("meta_description_fr"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const mediaAssets = pgTable("media_assets", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull().default(1).references(() => tenants.id, { onDelete: "cascade" }),
  filename: varchar("filename", { length: 180 }).notNull(),
  mimeType: varchar("mime_type", { length: 80 }).notNull(),
  size: integer("size").notNull(),
  data: bytea("data").notNull(),
  altAr: varchar("alt_ar", { length: 240 }),
  altFr: varchar("alt_fr", { length: 240 }),
  captionAr: varchar("caption_ar", { length: 300 }),
  captionFr: varchar("caption_fr", { length: 300 }),
  showInGallery: boolean("show_in_gallery").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  tenantId: integer("tenant_id").notNull().default(1).references(() => tenants.id, { onDelete: "cascade" }),
  value: text("value").notNull(),
});
