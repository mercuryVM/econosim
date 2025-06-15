// Teste específico para o validador de eventos globais
const Validators = require('./validators.js');

console.log('🔍 TESTANDO VALIDADOR DE EVENTOS GLOBAIS');
console.log('='.repeat(50));

// Teste 1: Evento global válido
const validGlobalEvent = {
    name: 'Crise Financeira Internacional',
    description: 'Uma crise bancária em grandes economias gerou pânico nos mercados.',
    goodEvent: false,
    asset: '/globalEvents/criseFinanceira.png',
    impact: {
        investimentoPrivado: -20,
        taxaDeJuros: 0.1,
        demandaMoeda: -3,
        score_factor: 0.8
    }
};

const validation1 = Validators.validateGlobalEvent(validGlobalEvent);
console.log('✅ Evento global válido:', validation1.isValid ? 'APROVADO' : 'REJEITADO');
if (!validation1.isValid) {
    console.log('   Erros:', validation1.errors);
}

// Teste 2: Evento global inválido (missing required fields)
const invalidGlobalEvent1 = {
    name: 'Evento Incompleto',
    // faltando description, goodEvent, impact
};

const validation2 = Validators.validateGlobalEvent(invalidGlobalEvent1);
console.log('❌ Evento global incompleto:', validation2.isValid ? 'APROVADO' : 'REJEITADO');
if (!validation2.isValid) {
    console.log('   Erros encontrados:', validation2.errors.length);
}

// Teste 3: Evento global com tipos incorretos
const invalidGlobalEvent2 = {
    name: 'Evento Inválido',
    description: 'Descrição válida',
    goodEvent: 'not_boolean', // Deveria ser boolean
    impact: {
        investimentoPrivado: 'not_number', // Deveria ser number
        score_factor: -5 // Fora do range válido
    }
};

const validation3 = Validators.validateGlobalEvent(invalidGlobalEvent2);
console.log('❌ Evento global com tipos incorretos:', validation3.isValid ? 'APROVADO' : 'REJEITADO');
if (!validation3.isValid) {
    console.log('   Erros encontrados:', validation3.errors.length);
}

// Teste 4: Evento global com impactos extremos
const invalidGlobalEvent3 = {
    name: 'Evento Extremo',
    description: 'Evento com valores extremos',
    goodEvent: true,
    impact: {
        investimentoPrivado: 999, // Fora do limite
        taxaDeJuros: 10, // Fora do limite
        score_factor: 0.01 // Dentro do range mas muito baixo
    }
};

const validation4 = Validators.validateGlobalEvent(invalidGlobalEvent3);
console.log('❌ Evento global com impactos extremos:', validation4.isValid ? 'APROVADO' : 'REJEITADO');
if (!validation4.isValid) {
    console.log('   Erros encontrados:', validation4.errors.length);
}

console.log('\n📊 RESUMO DO TESTE:');
console.log('-'.repeat(30));
const tests = [validation1, validation2, validation3, validation4];
const expected = [true, false, false, false];
const passed = tests.filter((test, i) => test.isValid === expected[i]).length;
console.log(`Testes aprovados: ${passed}/4`);
console.log(`Taxa de sucesso: ${(passed/4*100).toFixed(1)}%`);

if (passed === 4) {
    console.log('🎉 VALIDADOR DE EVENTOS GLOBAIS FUNCIONANDO PERFEITAMENTE!');
} else {
    console.log('⚠️ Alguns testes falharam');
}

console.log('='.repeat(50));
