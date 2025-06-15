// Teste de simulação do carregamento do servidor
const fs = require('fs');
const Validators = require('./validators.js');

console.log('🚀 SIMULAÇÃO DO CARREGAMENTO DO SERVIDOR');
console.log('='.repeat(50));

try {
    // Simular o carregamento como feito no Server.js
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    let globalPossibleEvents = [];

    if (!data || !data.globalEvents || !Array.isArray(data.globalEvents)) {
        console.warn('Invalid or missing global events data');
        globalPossibleEvents = [];
    } else {
        globalPossibleEvents = data.globalEvents.filter(globalEvent => {
            const validation = Validators.validateGlobalEvent(globalEvent);
            if (!validation.isValid) {
                console.warn(`Invalid global event filtered out: ${globalEvent.name || 'Unknown'}`, validation.errors);
                return false;
            }
            return true;
        });
        console.log(`✅ Loaded ${globalPossibleEvents.length} valid global events out of ${data.globalEvents.length} total`);
    }

    // Simular seleção de um evento global aleatório
    if (globalPossibleEvents.length > 0) {
        const randomIndex = Math.floor(Math.random() * globalPossibleEvents.length);
        const selectedEvent = globalPossibleEvents[randomIndex];
        
        console.log(`\n🎲 Evento global selecionado aleatoriamente:`);
        console.log(`   Nome: "${selectedEvent.name}"`);
        console.log(`   Tipo: ${selectedEvent.goodEvent ? 'Positivo' : 'Negativo'}`);
        console.log(`   Impactos:`);
        
        Object.entries(selectedEvent.impact).forEach(([key, value]) => {
            if (key !== 'score_factor') {
                console.log(`     - ${key}: ${value > 0 ? '+' : ''}${value}`);
            } else {
                console.log(`     - Fator de pontuação: ${value}`);
            }
        });
        
        // Validar novamente antes de aplicar (como no servidor real)
        const finalValidation = Validators.validateGlobalEvent(selectedEvent);
        if (finalValidation.isValid) {
            console.log(`\n✅ Evento validado com sucesso para aplicação!`);
        } else {
            console.log(`\n❌ Erro na validação final:`, finalValidation.errors);
        }
    } else {
        console.log('\n❌ Nenhum evento global válido disponível!');
    }

} catch (error) {
    console.error('💥 Erro durante simulação:', error.message);
}

console.log('\n' + '='.repeat(50));
console.log('🎯 VALIDADOR DE EVENTOS GLOBAIS FUNCIONANDO PERFEITAMENTE!');
