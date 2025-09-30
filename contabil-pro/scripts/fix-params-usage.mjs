import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';

// Encontrar todos os arquivos de páginas dinâmicas
const files = globSync('src/app/**/{page,layout}.{ts,tsx}', { 
  ignore: ['**/node_modules/**', '**/.next/**'],
  windowsPathsNoEscape: true 
});

let count = 0;

files.forEach(file => {
  try {
    const content = readFileSync(file, 'utf8');
    
    // Pular se não tem rotas dinâmicas
    if (!file.includes('[') || !file.includes(']')) {
      return;
    }
    
    // Pular se não tem params
    if (!content.includes('params')) {
      return;
    }
    
    let newContent = content;
    let changed = false;
    
    // Procurar por usos de params.id, params.slug, etc. fora de await
    // Padrão: params.id (sem await antes)
    const paramsAccessPattern = /(?<!await\s)(?<!await\s\()params\.(\w+)/g;
    
    // Verificar se há acessos diretos
    const matches = [...content.matchAll(paramsAccessPattern)];
    
    if (matches.length > 0) {
      // Verificar se já tem destructuring no início da função
      const hasDestructuring = /const\s+\{[^}]*\}\s+=\s+await\s+params/.test(content);
      
      if (!hasDestructuring) {
        // Adicionar destructuring após a declaração da função
        const functionPattern = /(export\s+default\s+async\s+function\s+\w+\([^)]*\)\s*\{)/;
        const match = content.match(functionPattern);
        
        if (match) {
          // Extrair os nomes dos parâmetros usados
          const paramNames = new Set();
          matches.forEach(m => paramNames.add(m[1]));
          
          const destructuring = `\n  const { ${[...paramNames].join(', ')} } = await params\n`;
          newContent = newContent.replace(functionPattern, `$1${destructuring}`);
          
          // Remover (await params). dos acessos
          newContent = newContent.replace(/\(await params\)\.(\w+)/g, '$1');
          
          changed = true;
        }
      } else {
        // Já tem destructuring, apenas substituir params.x por x
        matches.forEach(match => {
          const paramName = match[1];
          // Substituir params.paramName por paramName (mas não em definições de tipo ou destructuring)
          newContent = newContent.replace(
            new RegExp(`(?<!await\\s)(?<!await\\s\\()params\\.${paramName}(?!\\s*:)`, 'g'),
            paramName
          );
        });
        changed = true;
      }
    }
    
    // Se o conteúdo mudou, salvar
    if (changed) {
      writeFileSync(file, newContent, 'utf8');
      count++;
      console.log(`✓ ${file}`);
    }
  } catch (err) {
    console.error(`✗ ${file}: ${err.message}`);
  }
});

console.log(`\n✅ Updated ${count} files`);

