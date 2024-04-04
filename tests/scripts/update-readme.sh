#!/bin/bash

# Lê os resultados dos testes do arquivo test-results.txt
testResults=$(cat test-results.txt)

# Atualiza os resultados dos testes no arquivo package.json
jq --arg testResults "$testResults" '.testResults = $testResults' package.json > temp.json && mv temp.json package.json

# Atualiza o README.md com os resultados dos testes
sed -i '/<!-- TEST_RESULTS_START -->/,/<!-- TEST_RESULTS_END -->/d' README.md
sed -i "/<!-- TEST_RESULTS_START -->/a $testResults" README.md