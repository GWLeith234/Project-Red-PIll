import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import type { User, Permission } from "@shared/schema";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

export function requirePermission(...permissions: Permission[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { storage } = await import("./storage");
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return next();
    }

    const userPerms = user.permissions || [];
    const hasPermission = permissions.every(p => userPerms.includes(p));
    if (!hasPermission) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
}

export function sanitizeUser(user: User) {
  const { password, ...safe } = user;
  return safe;
}
