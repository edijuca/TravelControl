import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  vehicle: text("vehicle").notNull(), // "Carro" or "Moto"
  licensePlate: text("license_plate").notNull(),
  fuelPricePerLiter: decimal("fuel_price_per_liter", { precision: 10, scale: 2 }).default("6.00"),
  darkMode: boolean("dark_mode").default(true),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const routes = pgTable("routes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  kilometers: integer("kilometers").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const trips = pgTable("trips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").notNull(),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  kilometers: integer("kilometers").notNull(),
  fuelCost: decimal("fuel_cost", { precision: 10, scale: 2 }).notNull(),
  parkingCost: decimal("parking_cost", { precision: 10, scale: 2 }).default("0.00"),
  tollCost: decimal("toll_cost", { precision: 10, scale: 2 }).default("0.00"),
  otherCost: decimal("other_cost", { precision: 10, scale: 2 }).default("0.00"),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  userId: varchar("user_id").notNull().references(() => users.id),
  routeId: varchar("route_id").references(() => routes.id),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  trips: many(trips),
  routes: many(routes),
}));

export const routesRelations = relations(routes, ({ one, many }) => ({
  user: one(users, {
    fields: [routes.userId],
    references: [users.id],
  }),
  trips: many(trips),
}));

export const tripsRelations = relations(trips, ({ one }) => ({
  user: one(users, {
    fields: [trips.userId],
    references: [users.id],
  }),
  route: one(routes, {
    fields: [trips.routeId],
    references: [routes.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  resetToken: true,
  resetTokenExpiry: true,
});

export const registerUserSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
  vehicle: z.enum(["Carro", "Moto"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  emailOrUsername: z.string().min(1, "Email ou usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

export const newPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export const insertRouteSchema = createInsertSchema(routes).omit({
  id: true,
  createdAt: true,
});

export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  createdAt: true,
}).extend({
  date: z.string().transform((val) => new Date(val)),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;
export type NewPassword = z.infer<typeof newPasswordSchema>;
export type Route = typeof routes.$inferSelect;
export type InsertRoute = z.infer<typeof insertRouteSchema>;
export type Trip = typeof trips.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;
