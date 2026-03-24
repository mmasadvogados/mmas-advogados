// ============================================
// MMAS Advogados — Shared Types
// ============================================

export type ArticleStatus = "draft" | "review" | "published" | "rejected";
export type ArticleSource = "web" | "telegram";
export type UserRole = "admin" | "editor";
export type ArticleLength = "short" | "medium" | "long";
export type ArticleTone = "technical" | "accessible";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  body: string;
  summary: string | null;
  tags: string[];
  status: ArticleStatus;
  seoDescription: string | null;
  authorId: string | null;
  source: ArticleSource;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
}

export interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  confirmed: boolean;
  subscribedAt: Date;
  unsubscribedAt: Date | null;
}

export interface GeneratedArticle {
  title: string;
  body: string;
  summary: string;
  tags: string[];
  seoDescription: string;
}

export interface GenerateArticleOptions {
  topic: string;
  area?: string;
  length?: ArticleLength;
  tone?: ArticleTone;
}

// Practice areas
export const PRACTICE_AREAS = [
  "Internet",
  "Civil",
  "Empresarial",
  "Tributário",
  "Agrário e Ambiental",
  "Cooperativas",
  "Administrativo",
  "Trabalho",
  "Previdenciário",
  "Direito Médico e Hospitalar",
  "Direito Eleitoral",
] as const;

export type PracticeArea = (typeof PRACTICE_AREAS)[number];
