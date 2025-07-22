#!/usr/bin/env node

/**
 * 🚀 Script de Test Automatisé - Zukii API
 * 
 * Tests tous les endpoints des modules Boards, Blocks, Super-Blocks et Contents
 * Y compris la suppression et les cas d'erreur !
 */

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'test-auto@zukii.com',
  password: 'TestPassword123!',
  displayName: 'Auto Test'
};

// Variables globales
let authToken = '';
let boardId = '';
let blockId = '';
let superBlockId = '';
let contentId = '';

// Utilitaires
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Configuration axios avec intercepteurs
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000
});

api.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Tests
async function testAuth() {
  log('\n🔐 === TESTS AUTHENTIFICATION ===', 'yellow');

  try {
    // Register
    logInfo('1. Register User...');
    try {
      const registerRes = await api.post('/users', TEST_USER);
      logSuccess(`Register: ${registerRes.status}`);
    } catch (error) {
      if (error.response?.status === 409) {
        logWarning('User already exists - continuing...');
      } else {
        throw error;
      }
    }

    // Login
    logInfo('2. Login User...');
    const loginRes = await api.post('/auth/login', {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    logInfo(`Login response: ${JSON.stringify(loginRes.data, null, 2)}`);
    authToken = loginRes.data.access_token;
    logSuccess(`Login: ${loginRes.status} - Token saved: ${authToken ? 'YES' : 'NO'}`);

  } catch (error) {
    logError(`Auth failed: ${error.response?.status} ${error.response?.statusText}`);
    logError(`Details: ${JSON.stringify(error.response?.data, null, 2)}`);
    process.exit(1);
  }
}

async function testBoards() {
  log('\n📋 === TESTS BOARDS ===', 'yellow');

  try {
    // Create Board
    logInfo('1. Create Board...');
    const createRes = await api.post('/boards', {
      title: 'Board de Test Auto',
      description: 'Board créé par le script de test automatisé'
    });
    boardId = createRes.data.id;
    logSuccess(`Create Board: ${createRes.status} - ID: ${boardId}`);

    // Get All Boards
    logInfo('2. Get All Boards...');
    const getAllRes = await api.get('/boards');
    logSuccess(`Get All Boards: ${getAllRes.status} - Count: ${getAllRes.data.length}`);

    // Get Board by ID
    logInfo('3. Get Board by ID...');
    const getByIdRes = await api.get(`/boards/${boardId}`);
    logSuccess(`Get Board by ID: ${getByIdRes.status} - Title: ${getByIdRes.data.title}`);

    // Update Board
    logInfo('4. Update Board...');
    const updateRes = await api.patch(`/boards/${boardId}`, {
      title: 'Board de Test Auto - Modifié',
      description: 'Description mise à jour'
    });
    logSuccess(`Update Board: ${updateRes.status}`);

  } catch (error) {
    logError(`Boards test failed: ${error.response?.status} ${error.response?.statusText}`);
    logError(`Details: ${JSON.stringify(error.response?.data, null, 2)}`);
    logError(`Token being used: ${authToken ? authToken.substring(0, 20) + '...' : 'NO TOKEN'}`);
    throw error;
  }
}

async function testSuperBlocks() {
  log('\n🔷 === TESTS SUPER-BLOCKS ===', 'yellow');

  try {
    // Create Super-Block
    logInfo('1. Create Super-Block...');
    const createRes = await api.post(`/boards/${boardId}/super-blocks`, {
      title: 'Analyse Auto',
      color: '#6366f1',
      collapsed: false
    });
    superBlockId = createRes.data.id;
    logSuccess(`Create Super-Block: ${createRes.status} - ID: ${superBlockId}`);

    // Get All Super-Blocks
    logInfo('2. Get All Super-Blocks...');
    const getAllRes = await api.get(`/boards/${boardId}/super-blocks`);
    logSuccess(`Get All Super-Blocks: ${getAllRes.status} - Count: ${getAllRes.data.length}`);

    // Get Super-Block by ID
    logInfo('3. Get Super-Block by ID...');
    const getByIdRes = await api.get(`/boards/${boardId}/super-blocks/${superBlockId}`);
    logSuccess(`Get Super-Block by ID: ${getByIdRes.status} - Title: ${getByIdRes.data.title}`);

    // Update Super-Block
    logInfo('4. Update Super-Block...');
    const updateRes = await api.patch(`/boards/${boardId}/super-blocks/${superBlockId}`, {
      title: 'Analyse Auto - Modifiée',
      color: '#ef4444',
      collapsed: true
    });
    logSuccess(`Update Super-Block: ${updateRes.status}`);

  } catch (error) {
    logError(`Super-Blocks test failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

async function testBlocks() {
  log('\n📦 === TESTS BLOCKS ===', 'yellow');

  try {
    // Create Text Block
    logInfo('1. Create Text Block...');
    const createTextRes = await api.post(`/boards/${boardId}/blocks/content/text`, {
      title: 'Note de Test Auto',
      content: 'Voici le contenu automatisé de test pour vérifier le bon fonctionnement.',
      formatType: 'plain',
      positionX: 100,
      positionY: 200,
      width: 400,
      height: 300,
      zoneType: 'notes'
    });
    blockId = createTextRes.data.id;
    contentId = createTextRes.data.contentId;
    logSuccess(`Create Text Block: ${createTextRes.status} - ID: ${blockId}`);

    // Create CSV file for File Block test
    logInfo('2. Create Test CSV File...');
    const csvContent = 'nom,age,ville\nJean,25,Paris\nMarie,30,Lyon\nPierre,35,Marseille\n';
    fs.writeFileSync('./test-data.csv', csvContent);
    logSuccess('CSV Test file created');

    // Create File Block
    logInfo('3. Create File Block...');
    const form = new FormData();
    form.append('file', fs.createReadStream('./test-data.csv'));
    form.append('title', 'Données de Test Auto');
    form.append('positionX', '500');
    form.append('positionY', '200');
    form.append('zoneType', 'data');

    const createFileRes = await api.post(`/boards/${boardId}/blocks/content/file`, form, {
      headers: form.getHeaders()
    });
    logSuccess(`Create File Block: ${createFileRes.status} - ID: ${createFileRes.data.id}`);

    // Create Block in Super-Block
    logInfo('4. Create Block in Super-Block...');
    const createInSuperRes = await api.post(`/boards/${boardId}/blocks/content/text`, {
      title: 'Block dans Super-Block',
      content: 'Ce block appartient au super-block de test.',
      formatType: 'plain',
      positionX: 300,
      positionY: 400,
      superBlockId: superBlockId
    });
    logSuccess(`Create Block in Super-Block: ${createInSuperRes.status}`);

    // Get All Blocks
    logInfo('5. Get All Blocks...');
    const getAllRes = await api.get(`/boards/${boardId}/blocks`);
    logSuccess(`Get All Blocks: ${getAllRes.status} - Count: ${getAllRes.data.length}`);

    // Get Block by ID
    logInfo('6. Get Block by ID...');
    const getByIdRes = await api.get(`/boards/${boardId}/blocks/${blockId}`);
    logSuccess(`Get Block by ID: ${getByIdRes.status} - Title: ${getByIdRes.data.title}`);

    // Get Block Content
    logInfo('7. Get Block Content...');
    const getContentRes = await api.get(`/boards/${boardId}/blocks/${blockId}/content`);
    logSuccess(`Get Block Content: ${getContentRes.status} - Type: ${getContentRes.data.type}`);

    // Update Block Metadata
    logInfo('8. Update Block Metadata...');
    const updateMetaRes = await api.patch(`/boards/${boardId}/blocks/${blockId}`, {
      title: 'Note de Test Auto - Modifiée',
      width: 500,
      height: 350
    });
    logSuccess(`Update Block Metadata: ${updateMetaRes.status}`);

    // Update Block Position
    logInfo('9. Update Block Position...');
    const updatePosRes = await api.patch(`/boards/${boardId}/blocks/${blockId}/position`, {
      positionX: 150,
      positionY: 250,
      zIndex: 5
    });
    logSuccess(`Update Block Position: ${updatePosRes.status}`);

    // Update Block Content
    logInfo('10. Update Block Content...');
    const updateContentRes = await api.patch(`/boards/${boardId}/blocks/${blockId}/content`, {
      content: 'Contenu modifié automatiquement avec succès !',
      formatType: 'plain'
    });
    logSuccess(`Update Block Content: ${updateContentRes.status}`);

  } catch (error) {
    logError(`Blocks test failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

async function testBlockRelations() {
  log('\n🔗 === TESTS BLOCK RELATIONS ===', 'yellow');

  try {
    // Note: Creating a relation from a block to itself will fail, which is expected
    logInfo('1. Get Block Relations (should be empty initially)...');
    const getRelationsRes = await api.get(`/boards/${boardId}/blocks/${blockId}/relations`);
    logSuccess(`Get Block Relations: ${getRelationsRes.status} - Outgoing: ${getRelationsRes.data.outgoing.length}, Incoming: ${getRelationsRes.data.incoming.length}`);

    // We could test creating relations between different blocks if we had multiple block IDs
    logWarning('Skipping relation creation test (would need multiple blocks)');

  } catch (error) {
    logError(`Block Relations test failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

async function testDeletions() {
  log('\n🗑️  === TESTS SUPPRESSION ===', 'yellow');

  try {
    // Delete Block
    logInfo('1. Delete Block...');
    const deleteBlockRes = await api.delete(`/boards/${boardId}/blocks/${blockId}`);
    logSuccess(`Delete Block: ${deleteBlockRes.status}`);

    // Verify block is deleted
    logInfo('2. Verify Block Deletion...');
    try {
      await api.get(`/boards/${boardId}/blocks/${blockId}`);
      logError('Block should have been deleted!');
    } catch (error) {
      if (error.response?.status === 404) {
        logSuccess('Block correctly deleted (404 as expected)');
      } else {
        throw error;
      }
    }

    // Delete Super-Block
    logInfo('3. Delete Super-Block...');
    const deleteSuperRes = await api.delete(`/boards/${boardId}/super-blocks/${superBlockId}`);
    logSuccess(`Delete Super-Block: ${deleteSuperRes.status}`);

    // Delete Board
    logInfo('4. Delete Board...');
    const deleteBoardRes = await api.delete(`/boards/${boardId}`);
    logSuccess(`Delete Board: ${deleteBoardRes.status}`);

    // Verify board is deleted
    logInfo('5. Verify Board Deletion...');
    try {
      await api.get(`/boards/${boardId}`);
      logError('Board should have been deleted!');
    } catch (error) {
      if (error.response?.status === 404) {
        logSuccess('Board correctly deleted (404 as expected)');
      } else {
        throw error;
      }
    }

  } catch (error) {
    logError(`Deletion test failed: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

async function cleanup() {
  log('\n🧹 === NETTOYAGE ===', 'yellow');
  
  try {
    // Delete test CSV file
    if (fs.existsSync('./test-data.csv')) {
      fs.unlinkSync('./test-data.csv');
      logSuccess('Test CSV file deleted');
    }
  } catch (error) {
    logWarning(`Cleanup warning: ${error.message}`);
  }
}

async function runAllTests() {
  const startTime = Date.now();
  
  log('🚀 === DÉBUT DES TESTS AUTOMATISÉS ZUKII API ===', 'blue');
  log(`🎯 URL de base: ${BASE_URL}`, 'blue');
  
  try {
    await testAuth();
    await testBoards();
    await testSuperBlocks();
    await testBlocks();
    await testBlockRelations();
    await testDeletions();
    await cleanup();
    
    const duration = (Date.now() - startTime) / 1000;
    log(`\n🎉 === TOUS LES TESTS RÉUSSIS EN ${duration.toFixed(2)}s ===`, 'green');
    
  } catch (error) {
    await cleanup();
    log('\n💥 === ÉCHEC DES TESTS ===', 'red');
    logError(`Erreur: ${error.message}`);
    process.exit(1);
  }
}

// Vérification du serveur avant de commencer
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/api`, { timeout: 5000 });
    logSuccess('✅ Serveur accessible');
    return true;
  } catch (error) {
    logError('❌ Serveur non accessible. Assurez-vous que NestJS tourne sur le port 3000');
    logError('💡 Lancez: npm run start:dev');
    return false;
  }
}

// Point d'entrée
async function main() {
  if (await checkServer()) {
    await runAllTests();
  } else {
    process.exit(1);
  }
}

// Gestion des erreurs non gérées
process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

if (require.main === module) {
  main();
}

module.exports = { runAllTests, checkServer }; 