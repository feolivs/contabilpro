import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';

// Encontrar todos os arquivos TypeScript/TSX
const files = globSync('src/**/*.{ts,tsx}', { 
  ignore: ['**/node_modules/**', '**/.next/**'],
  windowsPathsNoEscape: true 
});

let count = 0;

files.forEach(file => {
  try {
    const content = readFileSync(file, 'utf8');
    let newContent = content;

    // Pular arquivos dentro de lib/auth/ e middleware
    if (file.includes('lib\\auth\\') || file.includes('lib/auth/') || file.includes('middleware.ts')) {
      return;
    }

    // Corrigir @/lib/rbac -> @/lib/auth/rbac
    if (content.includes("from '@/lib/rbac'") || content.includes('from "@/lib/rbac"')) {
      newContent = newContent.replace(
        /from ['"]@\/lib\/rbac['"]/g,
        "from '@/lib/auth/rbac'"
      );
    }

    // Corrigir @/lib/auth-helpers -> @/lib/auth/helpers
    if (content.includes("from '@/lib/auth-helpers'") || content.includes('from "@/lib/auth-helpers"')) {
      newContent = newContent.replace(
        /from ['"]@\/lib\/auth-helpers['"]/g,
        "from '@/lib/auth/helpers'"
      );
    }

    // Corrigir @/lib/tenants -> @/lib/auth/tenants
    if (content.includes("from '@/lib/tenants'") || content.includes('from "@/lib/tenants"')) {
      newContent = newContent.replace(
        /from ['"]@\/lib\/tenants['"]/g,
        "from '@/lib/auth/tenants'"
      );
    }

    // Corrigir imports de requireAuth e setRLSContext em actions
    // Eles devem vir de @/lib/auth, não @/lib/auth/rbac
    if (file.includes('actions\\') || file.includes('actions/')) {
      if (content.includes('requireAuth') || content.includes('setRLSContext')) {
        if (content.includes("from '@/lib/auth/rbac'")) {
          // Verificar se está importando requireAuth ou setRLSContext
          const lines = newContent.split('\n');
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes("from '@/lib/auth/rbac'") &&
                (line.includes('requireAuth') || line.includes('setRLSContext'))) {
              lines[i] = line.replace("from '@/lib/auth/rbac'", "from '@/lib/auth'");
            }
          }
          newContent = lines.join('\n');
        }
      }
    }

    // Se o conteúdo mudou, salvar
    if (newContent !== content) {
      writeFileSync(file, newContent, 'utf8');
      count++;
      console.log(`✓ ${file}`);
    }
  } catch (err) {
    console.error(`✗ ${file}: ${err.message}`);
  }
});

console.log(`\n✅ Updated ${count} files`);

