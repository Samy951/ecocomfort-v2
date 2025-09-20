import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { User } from '../entities/user.entity';
import { UserBadge } from '../entities/user-badge.entity';
import { UserLevel } from '../enums/user-level.enum';

// Load environment variables
dotenv.config();

const seedUsers = async () => {
  console.log('🌱 Démarrage du seeding des utilisateurs...');

  // Check if running in development
  if (process.env.NODE_ENV !== 'development') {
    console.error('❌ Ce script ne peut être exécuté qu\'en mode développement');
    process.exit(1);
  }

  console.log('📊 Connexion à la base de données PostgreSQL...');

  // Create DataSource connection
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [User, UserBadge],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Connexion établie');

    const userRepository = dataSource.getRepository(User);

    // Users to seed
    const usersToSeed = [
      {
        email: 'admin@ecocomfort.com',
        password: 'Admin@123',
        name: 'Administrateur',
      },
      {
        email: 'user@ecocomfort.com',
        password: 'User@123',
        name: 'Utilisateur Test',
      },
    ];

    for (const userData of usersToSeed) {
      console.log(`👤 Traitement de ${userData.email}...`);

      // Check if user already exists
      const existingUser = await userRepository.findOne({
        where: { email: userData.email },
      });

      if (existingUser) {
        console.log(`ℹ️ Utilisateur ${userData.email} existe déjà, ignoré`);
        continue;
      }

      // Hash password
      const hashedPassword = bcrypt.hashSync(userData.password, 10);

      // Create new user
      const newUser = userRepository.create({
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        points: 0,
        level: UserLevel.BRONZE,
      });

      await userRepository.save(newUser);
      console.log(`✅ Utilisateur '${userData.name}' créé avec succès`);
    }

    console.log('✨ Seeding terminé avec succès!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
};

// Execute seeder
seedUsers();