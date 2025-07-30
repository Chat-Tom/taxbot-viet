import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  businessType: text("business_type"),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const servicePackages = pgTable("service_packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameVi: text("name_vi").notNull(),
  description: text("description"),
  descriptionVi: text("description_vi"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("VND"),
  features: jsonb("features").notNull(),
  featuresVi: jsonb("features_vi").notNull(),
  isPopular: boolean("is_popular").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const taxCalculations = pgTable("tax_calculations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  calculationType: text("calculation_type").notNull(), // personal, corporate, vat
  inputData: jsonb("input_data").notNull(),
  result: jsonb("result").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contactInquiries = pgTable("contact_inquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  serviceInterest: text("service_interest"),
  message: text("message"),
  status: text("status").default("new"), // new, contacted, resolved
  createdAt: timestamp("created_at").defaultNow(),
});

// Customer registrations table - for storing registration data
export const customerRegistrations = pgTable("customer_registrations", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  businessType: text("business_type").notNull(), // individual, supersaver, custom
  packageId: integer("package_id").references(() => servicePackages.id),
  
  // Registration source and tracking
  registrationSource: text("registration_source").default("website"), // website, mobile, referral
  utm: jsonb("utm"), // UTM parameters for tracking
  
  // Status and workflow
  status: text("status").default("new"), // new, contacted, active, inactive
  contactedAt: timestamp("contacted_at"),
  activatedAt: timestamp("activated_at"),
  
  // Integration flags
  zapierSent: boolean("zapier_sent").default(false),
  zapierSentAt: timestamp("zapier_sent_at"),
  emailSent: boolean("email_sent").default(false),
  emailSentAt: timestamp("email_sent_at"),
  
  // Additional information
  notes: text("notes"),
  customerValue: decimal("customer_value", { precision: 10, scale: 2 }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  fileName: text("file_name").notNull(),
  fileType: text("file_type"),
  fileSize: integer("file_size"),
  filePath: text("file_path").notNull(),
  documentType: text("document_type"), // tax_return, invoice, receipt, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServicePackageSchema = createInsertSchema(servicePackages).omit({
  id: true,
  createdAt: true,
});

export const insertTaxCalculationSchema = createInsertSchema(taxCalculations).omit({
  id: true,
  createdAt: true,
});

export const insertContactInquirySchema = createInsertSchema(contactInquiries).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerRegistrationSchema = createInsertSchema(customerRegistrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  zapierSent: true,
  zapierSentAt: true,
  emailSent: true,
  emailSentAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type ServicePackage = typeof servicePackages.$inferSelect;
export type InsertServicePackage = z.infer<typeof insertServicePackageSchema>;
export type TaxCalculation = typeof taxCalculations.$inferSelect;
export type InsertTaxCalculation = z.infer<typeof insertTaxCalculationSchema>;
export type ContactInquiry = typeof contactInquiries.$inferSelect;
export type InsertContactInquiry = z.infer<typeof insertContactInquirySchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type CustomerRegistration = typeof customerRegistrations.$inferSelect;
export type InsertCustomerRegistration = z.infer<typeof insertCustomerRegistrationSchema>;

// Customer accounts table for customer login system
export const customers = pgTable("customers", {
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull(),
  businessName: text("business_name"),
  taxCode: text("tax_code"),
  phone: text("phone").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
