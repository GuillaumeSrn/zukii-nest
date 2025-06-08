import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { StatusSeeder } from '../src/database/seeds/status.seed';
import { DataSource } from 'typeorm';

async function initDevData() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);
  
  console.log('🌱 Initialisation des données de développement...');
  
  try {
    await StatusSeeder.run(dataSource);
    console.log('✅ Données initialisées avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation :', error);
  } finally {
    await app.close();
  }
}

void initDevData(); 