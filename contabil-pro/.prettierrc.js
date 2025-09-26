/** @type {import('prettier').Config} */
module.exports = {
  // Configurações básicas
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  useTabs: false,
  trailingComma: 'es5',
  printWidth: 100,
  
  // Configurações de quebra de linha (UTF-8)
  endOfLine: 'lf',
  
  // Configurações de espaçamento
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',
  
  // Configurações específicas para JSX
  jsxSingleQuote: true,
  
  // Configurações para diferentes tipos de arquivo
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
        tabWidth: 2
      }
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
        tabWidth: 2
      }
    },
    {
      files: '*.yml',
      options: {
        tabWidth: 2,
        singleQuote: false
      }
    },
    {
      files: '*.yaml',
      options: {
        tabWidth: 2,
        singleQuote: false
      }
    },
    {
      files: '*.css',
      options: {
        singleQuote: false
      }
    },
    {
      files: '*.scss',
      options: {
        singleQuote: false
      }
    }
  ]
}
