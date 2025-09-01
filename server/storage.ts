import { users, routes, trips, type User, type InsertUser, type Route, type InsertRoute, type Trip, type InsertTrip } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  
  // Route operations
  getRoutes(userId: string): Promise<Route[]>;
  createRoute(route: InsertRoute): Promise<Route>;
  updateRoute(id: string, route: Partial<InsertRoute>): Promise<Route>;
  deleteRoute(id: string): Promise<void>;
  
  // Trip operations
  getTrips(userId: string, filters?: {
    startDate?: string;
    endDate?: string;
    origin?: string;
    destination?: string;
  }): Promise<Trip[]>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: string, trip: Partial<InsertTrip>): Promise<Trip>;
  deleteTrip(id: string): Promise<void>;
  
  // Analytics
  getTripStats(userId: string): Promise<{
    monthlyTrips: number;
    totalKm: number;
    totalExpenses: string;
    totalRoutes: number;
  }>;
  getMonthlyData(userId: string): Promise<{
    trips: Array<{ month: string; count: number }>;
    expenses: Array<{ month: string; amount: string }>;
    kilometers: Array<{ month: string; total: number }>;
  }>;
  getTopRoutes(userId: string): Promise<Array<{
    origin: string;
    destination: string;
    kilometers: number;
    tripCount: number;
  }>>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
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

  async updateUser(id: string, updateUser: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updateUser)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getRoutes(userId: string): Promise<Route[]> {
    return await db
      .select()
      .from(routes)
      .where(eq(routes.userId, userId))
      .orderBy(desc(routes.createdAt));
  }

  async createRoute(insertRoute: InsertRoute): Promise<Route> {
    const [route] = await db
      .insert(routes)
      .values(insertRoute)
      .returning();
    return route;
  }

  async updateRoute(id: string, updateRoute: Partial<InsertRoute>): Promise<Route> {
    const [route] = await db
      .update(routes)
      .set(updateRoute)
      .where(eq(routes.id, id))
      .returning();
    return route;
  }

  async deleteRoute(id: string): Promise<void> {
    await db.delete(routes).where(eq(routes.id, id));
  }

  async getTrips(userId: string, filters?: {
    startDate?: string;
    endDate?: string;
    origin?: string;
    destination?: string;
  }): Promise<Trip[]> {
    let query = db.select().from(trips).where(eq(trips.userId, userId));
    
    if (filters?.startDate) {
      query = query.where(gte(trips.date, new Date(filters.startDate)));
    }
    if (filters?.endDate) {
      query = query.where(lte(trips.date, new Date(filters.endDate)));
    }
    if (filters?.origin) {
      query = query.where(eq(trips.origin, filters.origin));
    }
    if (filters?.destination) {
      query = query.where(eq(trips.destination, filters.destination));
    }
    
    return await query.orderBy(desc(trips.date));
  }

  async createTrip(insertTrip: InsertTrip): Promise<Trip> {
    const [trip] = await db
      .insert(trips)
      .values(insertTrip)
      .returning();
    return trip;
  }

  async updateTrip(id: string, updateTrip: Partial<InsertTrip>): Promise<Trip> {
    const [trip] = await db
      .update(trips)
      .set(updateTrip)
      .where(eq(trips.id, id))
      .returning();
    return trip;
  }

  async deleteTrip(id: string): Promise<void> {
    await db.delete(trips).where(eq(trips.id, id));
  }

  async getTripStats(userId: string): Promise<{
    monthlyTrips: number;
    totalKm: number;
    totalExpenses: string;
    totalRoutes: number;
  }> {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    
    const [tripStats] = await db
      .select({
        monthlyTrips: sql<number>`count(*) filter (where date >= ${currentMonth})`,
        totalKm: sql<number>`sum(kilometers)`,
        totalExpenses: sql<string>`sum(total_cost)`,
      })
      .from(trips)
      .where(eq(trips.userId, userId));

    const [routeCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(routes)
      .where(eq(routes.userId, userId));

    return {
      monthlyTrips: tripStats.monthlyTrips || 0,
      totalKm: tripStats.totalKm || 0,
      totalExpenses: tripStats.totalExpenses || "0.00",
      totalRoutes: routeCount.count || 0,
    };
  }

  async getMonthlyData(userId: string): Promise<{
    trips: Array<{ month: string; count: number }>;
    expenses: Array<{ month: string; amount: string }>;
    kilometers: Array<{ month: string; total: number }>;
  }> {
    const monthlyTrips = await db
      .select({
        month: sql<string>`to_char(date, 'Mon')`,
        count: sql<number>`count(*)`,
      })
      .from(trips)
      .where(eq(trips.userId, userId))
      .groupBy(sql`extract(month from date), to_char(date, 'Mon')`)
      .orderBy(sql`extract(month from date)`);

    const monthlyExpenses = await db
      .select({
        month: sql<string>`to_char(date, 'Mon')`,
        amount: sql<string>`sum(total_cost)`,
      })
      .from(trips)
      .where(eq(trips.userId, userId))
      .groupBy(sql`extract(month from date), to_char(date, 'Mon')`)
      .orderBy(sql`extract(month from date)`);

    const monthlyKilometers = await db
      .select({
        month: sql<string>`to_char(date, 'Mon')`,
        total: sql<number>`sum(kilometers)`,
      })
      .from(trips)
      .where(eq(trips.userId, userId))
      .groupBy(sql`extract(month from date), to_char(date, 'Mon')`)
      .orderBy(sql`extract(month from date)`);

    return {
      trips: monthlyTrips,
      expenses: monthlyExpenses,
      kilometers: monthlyKilometers,
    };
  }

  async getTopRoutes(userId: string): Promise<Array<{
    origin: string;
    destination: string;
    kilometers: number;
    tripCount: number;
  }>> {
    return await db
      .select({
        origin: trips.origin,
        destination: trips.destination,
        kilometers: sql<number>`avg(kilometers)::int`,
        tripCount: sql<number>`count(*)`,
      })
      .from(trips)
      .where(eq(trips.userId, userId))
      .groupBy(trips.origin, trips.destination)
      .orderBy(sql`count(*) desc`)
      .limit(5);
  }
}

export const storage = new DatabaseStorage();
