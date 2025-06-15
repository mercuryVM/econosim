// Teste de carregamento do servidor com eventos globais
const fs = require('fs');
const Validators = require('./validators.js');

console.log('📊 TESTE DE CARREGAMENTO DE EVENTOS GLOBAIS');
console.log('='.repeat(50));

try {
    // Carregar dados do arquivo JSON
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    
    if (!data.globalEvents || !Array.isArray(data.globalEvents)) {
        console.error('❌ Dados de eventos globais não encontrados ou inválidos');
        process.exit(1);
    }
    
    console.log(`📂 Total de eventos globais no arquivo: ${data.globalEvents.length}`);
    
    let validEvents = 0;
    let invalidEvents = 0;
    
    // Validar cada evento global
    data.globalEvents.forEach((globalEvent, index) => {
        const validation = Validators.validateGlobalEvent(globalEvent);
        
        if (validation.isValid) {
            validEvents++;
            console.log(`✅ Evento ${index + 1}: "${globalEvent.name}" - VÁLIDO`);
        } else {
            invalidEvents++;
            console.log(`❌ Evento ${index + 1}: "${globalEvent.name}" - INVÁLIDO`);
            console.log(`   Erros: ${validation.errors.join(', ')}`);
        }
    });
    
    console.log('\n📈 RESUMO:');
    console.log('-'.repeat(30));
    console.log(`Eventos válidos: ${validEvents}`);
    console.log(`Eventos inválidos: ${invalidEvents}`);
    console.log(`Taxa de sucesso: ${(validEvents / data.globalEvents.length * 100).toFixed(1)}%`);
    
    if (invalidEvents === 0) {
        console.log('\n🎉 TODOS OS EVENTOS GLOBAIS ESTÃO VÁLIDOS!');
        console.log('✅ O servidor pode carregar os eventos globais sem problemas.');
    } else {
        console.log('\n⚠️ Alguns eventos globais possuem problemas de validação.');
        console.log('❗ Estes eventos serão filtrados automaticamente pelo servidor.');
    }
    
} catch (error) {
    console.error('💥 Erro ao carregar arquivo de dados:', error.message);
    process.exit(1);
}

console.log('='.repeat(50));
