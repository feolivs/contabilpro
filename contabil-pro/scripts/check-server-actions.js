#!/usr/bin/env node

/**
 * Script de verificação de higiene dos Server Actions
 * Garante que arquivos "use server" só exportem funções async
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Cores para output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
}

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function findServerActionFiles(dir) {
  const files = []

  function scanDirectory(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)

      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        scanDirectory(fullPath)
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8')
          // Verificar se tem "use server" como diretiva, não em comentários
          const lines = content.split('\n')
          const hasUseServer = lines.some(line => {
            const trimmed = line.trim()
            return (
              (trimmed === "'use server'" || trimmed === '"use server"') &&
              !trimmed.startsWith('//') &&
              !trimmed.startsWith('*') &&
              !trimmed.startsWith('/*')
            )
          })

          if (hasUseServer) {
            files.push(fullPath)
          }
        } catch (error) {
          log('yellow', `⚠️  Erro ao ler arquivo ${fullPath}: ${error.message}`)
        }
      }
    }
  }

  scanDirectory(dir)
  return files
}

function checkServerActionFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const errors = []
  const warnings = []

  // Regex para encontrar exports
  const exportRegex = /^export\s+(const|let|var|type|interface|enum|class)\s+/gm
  const asyncFunctionRegex = /^export\s+async\s+function\s+/gm
  const functionRegex = /^export\s+function\s+/gm

  let match
  const lines = content.split('\n')

  // Verificar exports não permitidos
  while ((match = exportRegex.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split('\n').length
    const line = lines[lineNumber - 1]

    errors.push({
      type: 'INVALID_EXPORT',
      line: lineNumber,
      content: line.trim(),
      message: `Arquivo "use server" não pode exportar ${match[1]}`,
    })
  }

  // Verificar funções não-async
  while ((match = functionRegex.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split('\n').length
    const line = lines[lineNumber - 1]

    if (!line.includes('async')) {
      errors.push({
        type: 'NON_ASYNC_FUNCTION',
        line: lineNumber,
        content: line.trim(),
        message: 'Função em arquivo "use server" deve ser async',
      })
    }
  }

  // Verificar imports de types de actions
  const importFromActionsRegex = /import\s+.*from\s+['"]@\/actions\//g
  while ((match = importFromActionsRegex.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split('\n').length
    const line = lines[lineNumber - 1]

    warnings.push({
      type: 'IMPORT_FROM_ACTIONS',
      line: lineNumber,
      content: line.trim(),
      message: 'Evite importar de actions/ - use types/ ou schemas/',
    })
  }

  return { errors, warnings }
}

function checkImportHygiene(dir) {
  const errors = []

  function scanForBadImports(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)

      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        scanForBadImports(fullPath)
      } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
        // Pular arquivos de actions
        if (fullPath.includes('/actions/')) continue

        try {
          const content = fs.readFileSync(fullPath, 'utf8')
          const lines = content.split('\n')

          // Verificar imports de tipos de actions
          const importRegex = /import\s+.*\{[^}]*\}\s+from\s+['"]@\/actions\/[^'"]*['"]/g
          let match

          while ((match = importRegex.exec(content)) !== null) {
            const lineNumber = content.substring(0, match.index).split('\n').length
            const line = lines[lineNumber - 1]

            // Verificar se está importando tipos (maiúscula ou palavras como State, Type, etc.)
            const importContent = match[0]
            if (/\b[A-Z]\w*(?:State|Type|Interface|Props|Config)\b/.test(importContent)) {
              errors.push({
                file: fullPath,
                line: lineNumber,
                content: line.trim(),
                message: 'Componente importando tipos de actions/ - mover para types/',
              })
            }
          }
        } catch (error) {
          // Ignorar erros de leitura
        }
      }
    }
  }

  scanForBadImports(dir)
  return errors
}

function main() {
  log('blue', '🔍 Verificando higiene dos Server Actions...\n')

  const srcDir = path.join(process.cwd(), 'src')

  if (!fs.existsSync(srcDir)) {
    log('red', '❌ Diretório src/ não encontrado')
    process.exit(1)
  }

  // Encontrar arquivos "use server"
  const serverActionFiles = findServerActionFiles(srcDir)

  if (serverActionFiles.length === 0) {
    log('yellow', '⚠️  Nenhum arquivo "use server" encontrado')
    return
  }

  log('blue', `📁 Encontrados ${serverActionFiles.length} arquivos "use server":`)
  serverActionFiles.forEach(file => {
    log('blue', `   ${path.relative(process.cwd(), file)}`)
  })
  console.log()

  let totalErrors = 0
  let totalWarnings = 0

  // Verificar cada arquivo
  for (const filePath of serverActionFiles) {
    const relativePath = path.relative(process.cwd(), filePath)
    const { errors, warnings } = checkServerActionFile(filePath)

    if (errors.length > 0 || warnings.length > 0) {
      log('bold', `📄 ${relativePath}:`)

      errors.forEach(error => {
        log('red', `   ❌ Linha ${error.line}: ${error.message}`)
        log('red', `      ${error.content}`)
        totalErrors++
      })

      warnings.forEach(warning => {
        log('yellow', `   ⚠️  Linha ${warning.line}: ${warning.message}`)
        log('yellow', `      ${warning.content}`)
        totalWarnings++
      })

      console.log()
    }
  }

  // Verificar imports cruzados
  log('blue', '🔗 Verificando imports cruzados...')
  const importErrors = checkImportHygiene(srcDir)

  if (importErrors.length > 0) {
    log('bold', '\n📄 Imports cruzados encontrados:')
    importErrors.forEach(error => {
      const relativePath = path.relative(process.cwd(), error.file)
      log('red', `   ❌ ${relativePath}:${error.line}`)
      log('red', `      ${error.message}`)
      log('red', `      ${error.content}`)
      totalErrors++
    })
  }

  // Resultado final
  console.log()
  if (totalErrors > 0) {
    log('red', `❌ ${totalErrors} erro(s) encontrado(s)`)
    if (totalWarnings > 0) {
      log('yellow', `⚠️  ${totalWarnings} aviso(s) encontrado(s)`)
    }
    process.exit(1)
  } else if (totalWarnings > 0) {
    log('yellow', `⚠️  ${totalWarnings} aviso(s) encontrado(s)`)
    log('green', '✅ Nenhum erro crítico encontrado')
  } else {
    log('green', '✅ Todos os Server Actions estão em conformidade!')
  }
}

if (require.main === module) {
  main()
}

module.exports = { findServerActionFiles, checkServerActionFile, checkImportHygiene }
