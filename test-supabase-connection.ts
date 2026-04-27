import { createClient } from '@supabase/supabase-js';

// Charger les variables d'environnement
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('=== Test de connexion Supabase ===\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERREUR: Variables d\'environnement manquantes');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓ Configuré' : '✗ MANQUANT');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✓ Configuré' : '✗ MANQUANT');
  process.exit(1);
}

console.log('✓ Variables d\'environnement trouvées');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey.substring(0, 10) + '...\n');

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('Test de connexion à Supabase...');
    
    // Test simple: essayer de lister les tables
    const { data, error } = await supabase
      .from('AGENTS')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erreur de connexion:', error.message);
      process.exit(1);
    }
    
    console.log('✓ Connexion réussie à Supabase!');
    console.log('✓ La table AGENTS est accessible');
    
    // Test supplémentaire: récupérer quelques données
    const { data: agents, error: agentsError } = await supabase
      .from('AGENTS')
      .select('ID, Nom, email, Role')
      .limit(5);
    
    if (agentsError) {
      console.error('⚠ Erreur lors de la récupération des agents:', agentsError.message);
    } else {
      console.log(`\n✓ ${agents.length} agent(s) trouvé(s) dans la base:`);
      agents.forEach((agent: any) => {
        console.log(`  - ${agent.Nom} (${agent.Role})`);
      });
    }
    
    console.log('\n=== Test terminé avec succès ===');
  } catch (err) {
    console.error('❌ Erreur inattendue:', err);
    process.exit(1);
  }
}

testConnection();
