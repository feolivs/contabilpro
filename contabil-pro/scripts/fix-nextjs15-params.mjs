import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';

// Encontrar todos os arquivos de páginas dinâmicas
const files = globSync('src/app/**/{page,layout,route}.{ts,tsx}', { 
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
    
    // Pular se já está correto (params: Promise)
    if (content.includes('params: Promise<')) {
      return;
    }
    
    let newContent = content;
    let changed = false;
    
    // Padrão 1: params: { id: string }
    // Trocar para: params: Promise<{ id: string }>
    const pattern1 = /params:\s*\{\s*([^}]+)\s*\}/g;
    if (pattern1.test(content)) {
      newContent = newContent.replace(
        /params:\s*\{\s*([^}]+)\s*\}/g,
        'params: Promise<{ $1 }>'
      );
      changed = true;
    }
    
    // Padrão 2: Acessar params.id diretamente
    // Trocar para: (await params).id
    // Mas apenas se a função for async
    if (content.includes('export default async function') || 
        content.includes('export async function')) {
      
      // Procurar por acessos diretos a params
      const lines = newContent.split('\n');
      const newLines = [];
      let insideFunction = false;
      let functionIsAsync = false;
      
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // Detectar início de função
        if (line.includes('export default async function') || 
            line.includes('export async function')) {
          insideFunction = true;
          functionIsAsync = true;
        }
        
        // Detectar fim de função (simplificado)
        if (insideFunction && line.trim() === '}' && !line.includes('{')) {
          insideFunction = false;
          functionIsAsync = false;
        }
        
        // Se estamos dentro de uma função async e há acesso direto a params
        if (insideFunction && functionIsAsync) {
          // Padrão: const { id } = params
          if (line.includes('const {') && line.includes('} = params')) {
            line = line.replace('} = params', '} = await params');
            changed = true;
          }
          // Padrão: const id = params.id
          else if (line.includes('= params.') && !line.includes('await params')) {
            line = line.replace(/= params\./g, '= (await params).');
            changed = true;
          }
          // Padrão: params.id (sem atribuição)
          else if (line.includes('params.') && !line.includes('await params') && 
                   !line.includes('params:') && !line.includes('{ params')) {
            line = line.replace(/params\./g, '(await params).');
            changed = true;
          }
        }
        
        newLines.push(line);
      }
      
      if (changed) {
        newContent = newLines.join('\n');
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

