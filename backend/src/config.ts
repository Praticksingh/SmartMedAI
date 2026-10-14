import { z } from "zod";

try {
  process.loadEnvFile?.(".env");
} catch {}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  BACKEND_URL: z.string().default("http://localhost:4000"),
  DATABASE_URL: z.string().min(10).default("postgresql://postgres:postgres@localhost:5432/devfusion"),
  JWT_SECRET: z.string().min(32).default("devfusion_jwt_secret_change_me_2026_ready"),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(""),
  CLOUDINARY_API_KEY: z.string().optional().default(""),
  CLOUDINARY_API_SECRET: z.string().optional().default(""),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Environment configuration validation failed:");
  for (const issue of parsed.error.issues) {
    console.error(`   - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;

// Parse allowed frontend origins from comma-separated string or default
const configuredOrigins = env.FRONTEND_URL.split(",")
  .map((url) => url.trim().replace(/\/$/, ""))
  .filter(Boolean);

const defaultAllowedOrigins = [
  ...configuredOrigins,
  env.BACKEND_URL.replace(/\/$/, ""),
  "http://localhost:5173",
  "http://localhost:4000",
];

// Production safety validations
if (env.NODE_ENV === "production") {
  if (env.JWT_SECRET === "devfusion_jwt_secret_change_me_2026_ready") {
    console.error("❌ SECURITY ALERT: Default development JWT_SECRET cannot be used in production.");
    console.error("   Please provide a secure, unique JWT_SECRET (minimum 32 characters) in your environment variables.");
    process.exit(1);
  }

  if (env.DATABASE_URL.includes("localhost") || env.DATABASE_URL.includes("127.0.0.1")) {
    console.warn("⚠️ WARNING: DATABASE_URL appears to target localhost in production mode.");
    console.warn("   Make sure you configure a remote managed PostgreSQL URL (e.g. Neon, Supabase, Render).");
  }
}

export const appConfig = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  frontendUrl: env.FRONTEND_URL,
  backendUrl: env.BACKEND_URL,
  databaseUrl: env.DATABASE_URL,
  jwtSecret: env.JWT_SECRET,
  allowedOrigins: Array.from(new Set(defaultAllowedOrigins)),
  cloudinary: {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
  },
};

