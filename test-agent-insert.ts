import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAgentInsert() {
  console.log('🧪 Test d\'insertion d\'agent...');
  
  try {
    // Hasher le mot de passe
    const password = 'test123';
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✓ Mot de passe hashé');
    
    // Insérer un agent de test
    const { data, error } = await supabase
      .from('agents')
      .insert([{
        nom: 'Test Agent',
        email: 'test@example.com',
        role: 'Utilisateur',
        region: 'OUEST',
        password: hashedPassword
      }])
      .select();
    
    if (error) {
      console.error('❌ Erreur Supabase:', error);
      console.error('Code:', error.code);
      console.error('Message:', error.message);
      console.error('Détails:', error.details);
      console.error('Hint:', error.hint);
    } else {
      console.log('✓ Agent inséré avec succès:', data);
      
      // Supprimer l'agent de test
      if (data && data[0]) {
        await supabase.from('agents').delete().eq('id', data[0].id);
        console.log('✓ Agent de test supprimé');
      }
    }
  } catch (err) {
    console.error('❌ Erreur:', err);
  }
}

testAgentInsert();
