// Configuration globale pour les tests e2e
beforeAll(() => {
  // Configuration de la base de données de test
  process.env.NODE_ENV = 'test';
  process.env.DB_HOST = process.env.DB_HOST || 'localhost';
  process.env.DB_PORT = process.env.DB_PORT || '5432';
  process.env.DB_USERNAME = process.env.DB_USERNAME || 'test_user';
  process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'test_password';
  process.env.DB_NAME = process.env.DB_NAME || 'zukii_test';
});

// Nettoyage après chaque test
afterEach(() => {
  // Ici tu peux ajouter la logique de nettoyage de la base de données
  // par exemple, truncate des tables ou rollback des transactions
});

// Configuration Jest globale
jest.setTimeout(30000);
