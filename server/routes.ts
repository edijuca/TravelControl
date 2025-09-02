import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertRouteSchema, 
  insertTripSchema,
  registerUserSchema,
  loginSchema,
  resetPasswordSchema,
  newPasswordSchema
} from "@shared/schema";
import { z } from "zod";
import { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  generateResetToken, 
  authenticateToken,
  type AuthRequest 
} from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerUserSchema.parse(req.body);
      
      // Check if email or username already exists
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email já está em uso" });
      }
      
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Nome de usuário já está em uso" });
      }
      
      // Hash password and create user
      const hashedPassword = await hashPassword(userData.password);
      const { confirmPassword, ...userToCreate } = userData;
      
      const user = await storage.createUser({
        ...userToCreate,
        password: hashedPassword,
      });
      
      // Generate token
      const token = generateToken(user.id);
      
      // Remove password from response
      const { password, resetToken, resetTokenExpiry, ...userResponse } = user;
      
      res.status(201).json({ user: userResponse, token });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { emailOrUsername, password } = loginSchema.parse(req.body);
      
      // Find user by email or username
      const user = await storage.getUserByEmailOrUsername(emailOrUsername);
      if (!user) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }
      
      // Check password
      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }
      
      // Generate token
      const token = generateToken(user.id);
      
      // Remove sensitive data from response
      const { password: _, resetToken, resetTokenExpiry, ...userResponse } = user;
      
      res.json({ user: userResponse, token });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Remove sensitive data from response
      const { password, resetToken, resetTokenExpiry, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put("/api/auth/profile", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const updateData = insertUserSchema.partial().omit({ password: true }).parse(req.body);
      
      // Check if email or username already exists for other users
      if (updateData.email) {
        const existingUser = await storage.getUserByEmail(updateData.email);
        if (existingUser && existingUser.id !== req.userId) {
          return res.status(400).json({ message: "Email já está em uso" });
        }
      }
      
      if (updateData.username) {
        const existingUser = await storage.getUserByUsername(updateData.username);
        if (existingUser && existingUser.id !== req.userId) {
          return res.status(400).json({ message: "Nome de usuário já está em uso" });
        }
      }
      
      const user = await storage.updateUser(req.userId!, updateData);
      
      // Remove sensitive data from response
      const { password, resetToken, resetTokenExpiry, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/change-password", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { currentPassword, newPassword } = z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
      }).parse(req.body);
      
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Verify current password
      const isValidPassword = await comparePassword(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Senha atual incorreta" });
      }
      
      // Hash new password and update
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(req.userId!, { password: hashedPassword });
      
      res.json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = resetPasswordSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Return success even if user doesn't exist for security
        return res.json({ message: "Se o email existir, você receberá instruções de recuperação" });
      }
      
      // Generate reset token
      const resetToken = generateResetToken();
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
      
      await storage.setResetToken(user.id, resetToken, resetTokenExpiry);
      
      // TODO: Send email with reset link
      // For now, we'll just log the token for testing
      console.log(`Reset token for ${email}: ${resetToken}`);
      
      res.json({ message: "Se o email existir, você receberá instruções de recuperação" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = newPasswordSchema.parse(req.body);
      
      const user = await storage.getUserByResetToken(token);
      if (!user) {
        return res.status(400).json({ message: "Token inválido ou expirado" });
      }
      
      // Hash new password and update
      const hashedPassword = await hashPassword(password);
      await storage.updateUser(user.id, { password: hashedPassword });
      
      // Clear reset token
      await storage.clearResetToken(user.id);
      
      res.json({ message: "Senha redefinida com sucesso" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // User routes (protected)
  app.get("/api/users/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Users can only access their own data
      if (req.params.id !== req.userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      // Remove sensitive data from response
      const { password, resetToken, resetTokenExpiry, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(req.params.id, userData);
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Route routes (protected)
  app.get("/api/routes/:userId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Users can only access their own routes
      if (req.params.userId !== req.userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const routes = await storage.getRoutes(req.params.userId);
      res.json(routes);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/routes", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const routeData = insertRouteSchema.parse(req.body);
      
      // Ensure the route belongs to the authenticated user
      const routeWithUserId = { ...routeData, userId: req.userId! };
      
      const route = await storage.createRoute(routeWithUserId);
      res.status(201).json(route);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados de rota inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put("/api/routes/:id", async (req, res) => {
    try {
      const routeData = insertRouteSchema.partial().parse(req.body);
      const route = await storage.updateRoute(req.params.id, routeData);
      res.json(route);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid route data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/routes/:id", async (req, res) => {
    try {
      await storage.deleteRoute(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Trip routes (protected)
  app.get("/api/trips/:userId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Users can only access their own trips
      if (req.params.userId !== req.userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        origin: req.query.origin as string,
        destination: req.query.destination as string,
      };
      const trips = await storage.getTrips(req.params.userId, filters);
      res.json(trips);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/trips", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const tripData = insertTripSchema.parse(req.body);
      
      // Ensure the trip belongs to the authenticated user
      const tripWithUserId = { ...tripData, userId: req.userId! };
      
      const trip = await storage.createTrip(tripWithUserId);
      res.status(201).json(trip);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados de viagem inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put("/api/trips/:id", async (req, res) => {
    try {
      const tripData = insertTripSchema.partial().parse(req.body);
      const trip = await storage.updateTrip(req.params.id, tripData);
      res.json(trip);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid trip data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/trips/:id", async (req, res) => {
    try {
      await storage.deleteTrip(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Analytics routes (protected)
  app.get("/api/analytics/stats/:userId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Users can only access their own analytics
      if (req.params.userId !== req.userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const stats = await storage.getTripStats(req.params.userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/analytics/monthly/:userId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Users can only access their own analytics
      if (req.params.userId !== req.userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const data = await storage.getMonthlyData(req.params.userId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/analytics/top-routes/:userId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Users can only access their own analytics
      if (req.params.userId !== req.userId) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const routes = await storage.getTopRoutes(req.params.userId);
      res.json(routes);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Export CSV route
  app.get("/api/trips/:userId/export", async (req, res) => {
    try {
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        origin: req.query.origin as string,
        destination: req.query.destination as string,
      };
      const trips = await storage.getTrips(req.params.userId, filters);
      
      const csvHeader = "Data,Origem,Destino,KM,Combustível,Estacionamento,Pedágio,Outras,Total,Observações\n";
      const csvData = trips.map(trip => {
        const date = new Date(trip.date).toLocaleDateString('pt-BR');
        return `${date},${trip.origin},${trip.destination},${trip.kilometers},${trip.fuelCost},${trip.parkingCost},${trip.tollCost},${trip.otherCost},${trip.totalCost},"${trip.notes || ''}"`;
      }).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="viagens.csv"');
      res.send(csvHeader + csvData);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
