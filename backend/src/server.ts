import { createApp } from './app.js';
import { config } from './config/env.js';
import { connectMongo, prisma } from './config/database.js';
import { setupQueues } from './config/queues.js';
import { isCloudinaryConfigured } from './config/cloudinary.js';
import { AuthService } from './services/auth.service.js';

async function bootstrap() {
  console.log('----------------------------------------------------');
  console.log('☕ Starting Code & Coffee Fullstack Blog Platform...');
  console.log('----------------------------------------------------');

  // Initialize Queues & Mongo
  setupQueues();
  await connectMongo();

  // Cloudinary v2 Status
  if (isCloudinaryConfigured()) {
    console.log('☁️ Cloudinary v2 Object Storage: Active & Ready for photos.');
  } else {
    console.log('📁 Object Storage: Local /uploads active (Cloudinary v2 keys can be set in .env).');
  }

  // Ensure default Admin user exists in Neon DB
  try {
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!existingAdmin) {
      console.log(`⚡ Creating default initial administrator account (${config.initialAdmin.email})...`);
      const passwordHash = await AuthService.hashPassword(config.initialAdmin.password);
      await prisma.user.create({
        data: {
          name: config.initialAdmin.name,
          email: config.initialAdmin.email.toLowerCase(),
          passwordHash,
          role: 'ADMIN',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          bio: 'Founder & Chief Architect at Code & Coffee. Writing on distributed systems, modern web, and clean code.',
        },
      });
      console.log(`✅ Default admin created. Login with: ${config.initialAdmin.email} / ${config.initialAdmin.password}`);
    }
  } catch (dbErr) {
    console.warn('ℹ️ Neon DB initialization note (schema may need db push):', (dbErr as Error).message);
  }

  const app = createApp();

  const server = app.listen(config.port, () => {
    console.log(`🚀 Code & Coffee API v1 running live on http://localhost:${config.port}`);
    console.log(`📡 Health Check URL: http://localhost:${config.port}/api/v1/health`);
    console.log(`🌐 Allowed Client URL: ${config.clientUrl}`);
    console.log('----------------------------------------------------');
  });

  const shutdown = async () => {
    console.log('\n🛑 Gracefully shutting down Code & Coffee API server...');
    server.close(async () => {
      await prisma.$disconnect();
      console.log('👋 Clean exit completed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrapping error:', err);
  process.exit(1);
});
