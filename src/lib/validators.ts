import { z } from "zod";

export const generateArticleSchema = z.object({
  topic: z.string().min(3).max(500),
  area: z.string().optional(),
  length: z.enum(["short", "medium", "long"]).default("medium"),
  tone: z.enum(["technical", "accessible"]).default("technical"),
});

export const subscribeSchema = z.object({
  email: z.string().email(),
  name: z.string().max(100).optional(),
});

export const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(2).max(200),
  message: z.string().min(10).max(5000),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const articleUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["draft", "review", "published", "rejected"]).optional(),
  seoDescription: z.string().optional(),
});
