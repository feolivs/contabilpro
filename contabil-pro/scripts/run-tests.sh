#!/bin/bash

# Script para executar todos os tipos de teste
# Execute: chmod +x scripts/run-tests.sh && ./scripts/run-tests.sh

set -e

echo " Executando suite completa de testes do ContabilPRO..."

# Verificar se o servidor esta rodando
check_server() {
    echo " Verificando se o servidor esta rodando..."
    if curl -s http://localhost:3001/api/health > /dev/null; then
        echo " Servidor esta rodando"
        return 0
    else
        echo " Servidor nao esta rodando"
        echo " Execute: npm run dev"
        return 1
    fi
}

# Executar testes unitarios
run_unit_tests() {
    echo ""
    echo " Executando testes unitarios..."
    npm run test -- --run --reporter=verbose
    
    if [ $? -eq 0 ]; then
        echo " Testes unitarios passaram"
    else
        echo " Testes unitarios falharam"
        exit 1
    fi
}

# Executar testes de integracao
run_integration_tests() {
    echo ""
    echo " Executando testes de integracao..."
    npm run test -- --run --reporter=verbose src/**/*.integration.test.ts
    
    if [ $? -eq 0 ]; then
        echo " Testes de integracao passaram"
    else
        echo " Testes de integracao falharam"
        exit 1
    fi
}

# Executar testes E2E com Playwright
run_e2e_tests() {
    echo ""
    echo " Executando testes E2E com Playwright..."
    
    if ! check_server; then
        echo " Pulando testes E2E - servidor nao esta rodando"
        return 0
    fi
    
    npm run test:e2e
    
    if [ $? -eq 0 ]; then
        echo " Testes E2E passaram"
    else
        echo " Testes E2E falharam"
        exit 1
    fi
}

# Executar testes BDD
run_bdd_tests() {
    echo ""
    echo " Executando testes BDD..."
    
    if ! check_server; then
        echo " Pulando testes BDD - servidor nao esta rodando"
        return 0
    fi
    
    npm run test:bdd
    
    if [ $? -eq 0 ]; then
        echo " Testes BDD passaram"
    else
        echo " Testes BDD falharam"
        exit 1
    fi
}

# Gerar relatorio de cobertura
generate_coverage() {
    echo ""
    echo " Gerando relatorio de cobertura..."
    npm run test:coverage -- --run
    
    echo " Relatorio de cobertura disponivel em: coverage/index.html"
}

# Executar linting
run_linting() {
    echo ""
    echo " Executando linting..."
    npm run lint
    
    if [ $? -eq 0 ]; then
        echo " Linting passou"
    else
        echo " Linting falhou"
        exit 1
    fi
}

# Funcao principal
main() {
    local test_type=${1:-"all"}
    
    case $test_type in
        "unit")
            run_unit_tests
            ;;
        "integration")
            run_integration_tests
            ;;
        "e2e")
            run_e2e_tests
            ;;
        "bdd")
            run_bdd_tests
            ;;
        "coverage")
            generate_coverage
            ;;
        "lint")
            run_linting
            ;;
        "all")
            run_linting
            run_unit_tests
            run_integration_tests
            run_e2e_tests
            run_bdd_tests
            generate_coverage
            ;;
        *)
            echo " Tipo de teste invalido: $test_type"
            echo ""
            echo "Uso: $0 [unit|integration|e2e|bdd|coverage|lint|all]"
            echo ""
            echo "Exemplos:"
            echo "  $0 unit      # Apenas testes unitarios"
            echo "  $0 e2e       # Apenas testes E2E"
            echo "  $0 all       # Todos os testes (padrao)"
            exit 1
            ;;
    esac
    
    echo ""
    echo " Testes concluidos com sucesso!"
    echo ""
    echo " Relatorios disponiveis:"
    echo "   test-results/     # Resultados dos testes"
    echo "   coverage/         # Cobertura de codigo"
    echo "   playwright-report/ # Relatorio Playwright"
    echo ""
}

# Executar funcao principal com argumentos
main "$@"
