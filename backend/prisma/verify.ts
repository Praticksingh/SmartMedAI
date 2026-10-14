import { PrismaClient } from "@prisma/client";

try {
  process.loadEnvFile?.(".env");
} catch {}

async function verifyConnection() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ ERROR: DATABASE_URL environment variable is not set.");
    console.error("   Please set $env:DATABASE_URL in PowerShell before running this verification.");
    process.exit(1);
  }

  const isPostgres = url.startsWith("postgresql://") || url.startsWith("postgres://");
  if (!isPostgres) {
    console.error("❌ ERROR: DATABASE_URL must start with postgresql:// or postgres://");
    process.exit(1);
  }

  const hasSsl = url.includes("sslmode=");
  if (!hasSsl) {
    console.warn("⚠️  NOTE: Connection string does not specify sslmode. For Supabase, append '?sslmode=require'.");
  }

  const prisma = new PrismaClient({
    datasources: {
      db: { url },
    },
    log: ["error"],
  });

  try {
    console.log("🔄 Testing connection to PostgreSQL database...");

    // 1. Connectivity ping
    await prisma.$queryRaw`SELECT 1 as ping`;
    console.log("✅ Database connectivity: SUCCESSFUL (Ping OK)");

    // 2. Query public tables count
    const tables: Array<{ table_name: string }> = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    console.log(`📊 Public Schema Status: Found ${tables.length} existing table(s).`);

    if (tables.length === 0) {
      console.log("✨ Database is CLEAN and EMPTY.");
      console.log("   Ready for initial schema push via: npx prisma db push");
    } else {
      console.log("ℹ️  Existing tables detected in database:");
      tables.forEach((t) => console.log(`   - ${t.table_name}`));
    }
  } catch (error: any) {
    console.error("❌ Database connection test failed:");
    console.error(`   ${error.message?.split("\n")[0] || error.message || "Unknown error"}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyConnection();
