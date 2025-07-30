import { 
  users, 
  servicePackages,
  taxCalculations,
  contactInquiries,
  documents,
  customerRegistrations,
  type User, 
  type InsertUser,
  type ServicePackage,
  type InsertServicePackage,
  type TaxCalculation,
  type InsertTaxCalculation,
  type ContactInquiry,
  type InsertContactInquiry,
  type Document,
  type InsertDocument,
  type CustomerRegistration,
  type InsertCustomerRegistration
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Service package operations
  getServicePackages(): Promise<ServicePackage[]>;
  getServicePackage(id: number): Promise<ServicePackage | undefined>;
  createServicePackage(pkg: InsertServicePackage): Promise<ServicePackage>;
  
  // Tax calculation operations
  createTaxCalculation(calc: InsertTaxCalculation): Promise<TaxCalculation>;
  getTaxCalculationsByUser(userId: number): Promise<TaxCalculation[]>;
  
  // Contact inquiry operations
  createContactInquiry(inquiry: InsertContactInquiry): Promise<ContactInquiry>;
  getContactInquiries(): Promise<ContactInquiry[]>;
  
  // Document operations
  createDocument(doc: InsertDocument): Promise<Document>;
  getDocumentsByUser(userId: number): Promise<Document[]>;
  
  // Customer registration operations
  createCustomerRegistration(registration: InsertCustomerRegistration): Promise<CustomerRegistration>;
  getCustomerRegistrations(): Promise<CustomerRegistration[]>;
  getCustomerRegistration(id: number): Promise<CustomerRegistration | undefined>;
  updateCustomerRegistration(id: number, updates: Partial<CustomerRegistration>): Promise<CustomerRegistration>;
  getCustomerRegistrationsByStatus(status: string): Promise<CustomerRegistration[]>;
  markZapierSent(id: number): Promise<void>;
  markEmailSent(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Service package operations
  async getServicePackages(): Promise<ServicePackage[]> {
    return await db
      .select()
      .from(servicePackages)
      .where(eq(servicePackages.isActive, true))
      .orderBy(servicePackages.price);
  }

  async getServicePackage(id: number): Promise<ServicePackage | undefined> {
    const [pkg] = await db
      .select()
      .from(servicePackages)
      .where(eq(servicePackages.id, id));
    return pkg || undefined;
  }

  async createServicePackage(pkg: InsertServicePackage): Promise<ServicePackage> {
    const [servicePackage] = await db
      .insert(servicePackages)
      .values(pkg)
      .returning();
    return servicePackage;
  }

  // Tax calculation operations
  async createTaxCalculation(calc: InsertTaxCalculation): Promise<TaxCalculation> {
    const [taxCalculation] = await db
      .insert(taxCalculations)
      .values(calc)
      .returning();
    return taxCalculation;
  }

  async getTaxCalculationsByUser(userId: number): Promise<TaxCalculation[]> {
    return await db
      .select()
      .from(taxCalculations)
      .where(eq(taxCalculations.userId, userId))
      .orderBy(desc(taxCalculations.createdAt));
  }

  // Contact inquiry operations
  async createContactInquiry(inquiry: InsertContactInquiry): Promise<ContactInquiry> {
    const [contactInquiry] = await db
      .insert(contactInquiries)
      .values(inquiry)
      .returning();
    return contactInquiry;
  }

  async getContactInquiries(): Promise<ContactInquiry[]> {
    return await db
      .select()
      .from(contactInquiries)
      .orderBy(desc(contactInquiries.createdAt));
  }

  // Document operations
  async createDocument(doc: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(doc)
      .returning();
    return document;
  }

  async getDocumentsByUser(userId: number): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt));
  }

  // Customer registration operations
  async createCustomerRegistration(registration: InsertCustomerRegistration): Promise<CustomerRegistration> {
    const [createdRegistration] = await db
      .insert(customerRegistrations)
      .values({
        ...registration,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return createdRegistration;
  }

  async getCustomerRegistrations(): Promise<CustomerRegistration[]> {
    return await db.select().from(customerRegistrations).orderBy(desc(customerRegistrations.createdAt));
  }

  async getCustomerRegistration(id: number): Promise<CustomerRegistration | undefined> {
    const [registration] = await db
      .select()
      .from(customerRegistrations)
      .where(eq(customerRegistrations.id, id));
    return registration;
  }

  async updateCustomerRegistration(id: number, updates: Partial<CustomerRegistration>): Promise<CustomerRegistration> {
    const [updatedRegistration] = await db
      .update(customerRegistrations)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(customerRegistrations.id, id))
      .returning();
    return updatedRegistration;
  }

  async getCustomerRegistrationsByStatus(status: string): Promise<CustomerRegistration[]> {
    return await db
      .select()
      .from(customerRegistrations)
      .where(eq(customerRegistrations.status, status))
      .orderBy(desc(customerRegistrations.createdAt));
  }

  async markZapierSent(id: number): Promise<void> {
    await db
      .update(customerRegistrations)
      .set({
        zapierSent: true,
        zapierSentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(customerRegistrations.id, id));
  }

  async markEmailSent(id: number): Promise<void> {
    await db
      .update(customerRegistrations)
      .set({
        emailSent: true,
        emailSentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(customerRegistrations.id, id));
  }
}

export const storage = new DatabaseStorage();
