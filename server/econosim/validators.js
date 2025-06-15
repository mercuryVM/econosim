// Arquivo de validadores para melhorar a segurança do servidor
class Validators {
    
    // Validar dados de economia
    static validateEconomyData(data) {
        const errors = [];
        
        if (!data || typeof data !== 'object') {
            errors.push('Economy data must be an object');
            return { isValid: false, errors };
        }

        // Validar valores numéricos obrigatórios
        const requiredNumbers = [
            'taxaDeJuros', 'consumoFamiliar', 'investimentoPrivado', 
            'gastosPublicos', 'ofertaMoeda', 'nivelPrecos', 'demandaMoeda',
            'sensibilidadeInvestimentoAoJuros', 'sensibilidadeDaMoedaAosJuros', 
            'sensibilidadeDaMoedaARenda'
        ];

        for (const field of requiredNumbers) {
            if (typeof data[field] !== 'number' || !isFinite(data[field])) {
                errors.push(`${field} must be a finite number`);
            }
        }

        // Validar limites mínimos
        const limits = {
            taxaDeJuros: { min: 0, max: 1 },
            consumoFamiliar: { min: 1, max: 10000 },
            investimentoPrivado: { min: 0, max: 10000 },
            gastosPublicos: { min: 1, max: 10000 },
            ofertaMoeda: { min: 0.1, max: 10000 },
            nivelPrecos: { min: 10, max: 10000 },
            demandaMoeda: { min: 0.1, max: 10000 },
            sensibilidadeInvestimentoAoJuros: { min: 1, max: 10000 },
            sensibilidadeDaMoedaAosJuros: { min: 1, max: 10000 },
            sensibilidadeDaMoedaARenda: { min: 1, max: 10000 }
        };

        for (const [field, limit] of Object.entries(limits)) {
            if (data[field] < limit.min || data[field] > limit.max) {
                errors.push(`${field} must be between ${limit.min} and ${limit.max}`);
            }
        }

        return { isValid: errors.length === 0, errors };
    }

    // Validar evento
    static validateEvent(event) {
        const errors = [];
        
        if (!event || typeof event !== 'object') {
            errors.push('Event must be an object');
            return { isValid: false, errors };
        }

        // Validar campos obrigatórios
        const requiredFields = ['name', 'description', 'options', 'outcomes'];
        for (const field of requiredFields) {
            if (!event[field]) {
                errors.push(`Event missing required field: ${field}`);
            }
        }

        // Validar estrutura de opções
        if (event.options) {
            if (!event.options.banco || !Array.isArray(event.options.banco)) {
                errors.push('Event options must have banco array');
            }
            if (!event.options.governo || !Array.isArray(event.options.governo)) {
                errors.push('Event options must have governo array');
            }
        }

        // Validar outcomes
        if (event.outcomes && Array.isArray(event.outcomes)) {
            for (let i = 0; i < event.outcomes.length; i++) {
                const outcome = event.outcomes[i];
                if (!outcome.combo || !Array.isArray(outcome.combo)) {
                    errors.push(`Outcome ${i} must have combo array`);
                }
                if (typeof outcome.chance !== 'number' || outcome.chance < 0 || outcome.chance > 1) {
                    errors.push(`Outcome ${i} chance must be a number between 0 and 1`);
                }
            }
        }

        return { isValid: errors.length === 0, errors };
    }

    // Validar evento global (estrutura mais simples que eventos locais)
    static validateGlobalEvent(globalEvent) {
        const errors = [];
        
        if (!globalEvent || typeof globalEvent !== 'object') {
            errors.push('Global event must be an object');
            return { isValid: false, errors };
        }

        // Validar campos obrigatórios para eventos globais
        const requiredFields = ['name', 'description', 'impact', 'goodEvent'];
        for (const field of requiredFields) {
            if (globalEvent[field] === undefined || globalEvent[field] === null) {
                errors.push(`Global event missing required field: ${field}`);
            }
        }

        // Validar tipos específicos
        if (globalEvent.name !== undefined && typeof globalEvent.name !== 'string') {
            errors.push('Global event name must be a string');
        }

        if (globalEvent.description !== undefined && typeof globalEvent.description !== 'string') {
            errors.push('Global event description must be a string');
        }

        if (globalEvent.goodEvent !== undefined && typeof globalEvent.goodEvent !== 'boolean') {
            errors.push('Global event goodEvent must be a boolean');
        }

        if (globalEvent.asset !== undefined && typeof globalEvent.asset !== 'string') {
            errors.push('Global event asset must be a string');
        }

        // Validar estrutura do impact
        if (globalEvent.impact) {
            if (typeof globalEvent.impact !== 'object') {
                errors.push('Global event impact must be an object');
            } else {
                // Validar campos de impacto econômico
                const economicFields = [
                    'taxaDeJuros', 'consumoFamiliar', 'investimentoPrivado', 
                    'gastosPublicos', 'ofertaMoeda', 'nivelPrecos', 'demandaMoeda'
                ];
                
                for (const field of economicFields) {
                    if (globalEvent.impact[field] !== undefined) {
                        if (typeof globalEvent.impact[field] !== 'number' || !isFinite(globalEvent.impact[field])) {
                            errors.push(`Global event impact.${field} must be a finite number`);
                        }
                    }
                }

                // Validar campos de sensibilidade (_change e _factor)
                const sensitivityFields = [
                    'sensibilidadeInvestimentoAoJuros_change', 'sensibilidadeInvestimentoAoJuros_factor',
                    'sensibilidadeDaMoedaAosJuros_change', 'sensibilidadeDaMoedaAosJuros_factor',
                    'sensibilidadeDaMoedaARenda_change', 'sensibilidadeDaMoedaARenda_factor'
                ];

                for (const field of sensitivityFields) {
                    if (globalEvent.impact[field] !== undefined) {
                        if (typeof globalEvent.impact[field] !== 'number' || !isFinite(globalEvent.impact[field])) {
                            errors.push(`Global event impact.${field} must be a finite number`);
                        }
                    }
                }

                // Validar score_factor
                if (globalEvent.impact.score_factor !== undefined) {
                    if (typeof globalEvent.impact.score_factor !== 'number' || !isFinite(globalEvent.impact.score_factor)) {
                        errors.push('Global event impact.score_factor must be a finite number');
                    } else if (globalEvent.impact.score_factor <= 0 || globalEvent.impact.score_factor > 5) {
                        errors.push('Global event impact.score_factor must be between 0 and 5');
                    }
                }

                // Validar limites razoáveis para impactos econômicos
                const impactLimits = {
                    taxaDeJuros: { min: -1, max: 1 },
                    consumoFamiliar: { min: -100, max: 100 },
                    investimentoPrivado: { min: -100, max: 100 },
                    gastosPublicos: { min: -100, max: 100 },
                    ofertaMoeda: { min: -100, max: 100 },
                    nivelPrecos: { min: -5, max: 5 },
                    demandaMoeda: { min: -100, max: 100 }
                };

                for (const [field, limit] of Object.entries(impactLimits)) {
                    if (globalEvent.impact[field] !== undefined) {
                        if (globalEvent.impact[field] < limit.min || globalEvent.impact[field] > limit.max) {
                            errors.push(`Global event impact.${field} must be between ${limit.min} and ${limit.max}`);
                        }
                    }
                }
            }
        }

        return { isValid: errors.length === 0, errors };
    }

    // Validar input do socket
    static validateSocketInput(data, type) {
        const errors = [];
        
        switch (type) {
            case 'roundOptionSelected':
                if(data === null) {
                    break; // Permitir null para desabilitar opção
                }
                if (typeof data !== 'number' || isNaN(data)) {
                    errors.push('Option must be a number');
                } else if (data < -1 || data > 100) {
                    errors.push('Option must be between -1 and 100');
                }
                break;
                
            case 'nickname':
                if (typeof data !== 'string') {
                    errors.push('Nickname must be a string');
                } else if (data.trim().length === 0) {
                    errors.push('Nickname cannot be empty');
                } else if (data.length > 50) {
                    errors.push('Nickname too long (max 50 characters)');
                }
                break;
                
            case 'role':
                if (typeof data !== 'number' || isNaN(data)) {
                    errors.push('Role must be a number');
                } else if (data < 0 || data > 1) {
                    errors.push('Role must be 0 (banco) or 1 (governo)');
                }
                break;
                
            case 'economy':
                if (typeof data !== 'number' || isNaN(data)) {
                    errors.push('Economy must be a number');
                } else if (data < 0) {
                    errors.push('Economy must be non-negative');
                }
                break;
                
            default:
                errors.push('Unknown validation type');
        }
        
        return { isValid: errors.length === 0, errors };
    }

    // Sanitizar string para prevenir ataques
    static sanitizeString(str, maxLength = 100) {
        if (typeof str !== 'string') {
            return '';
        }
        
        return str
            .trim()
            .substring(0, maxLength)
            .replace(/[<>]/g, '') // Remove caracteres HTML básicos
            .replace(/javascript:/gi, '') // Remove javascript: URLs
            .replace(/on\w+=/gi, ''); // Remove event handlers
    }

    // Validar se um número está dentro de um range
    static isNumberInRange(value, min, max) {
        return typeof value === 'number' && 
               isFinite(value) && 
               value >= min && 
               value <= max;
    }

    // Validar estrutura de dados JSON
    static validateJsonStructure(data, schema) {
        const errors = [];
        
        function validate(obj, schemaObj, path = '') {
            for (const [key, expectedType] of Object.entries(schemaObj)) {
                const currentPath = path ? `${path}.${key}` : key;
                
                if (!(key in obj)) {
                    errors.push(`Missing required field: ${currentPath}`);
                    continue;
                }
                
                const value = obj[key];
                
                if (expectedType === 'string' && typeof value !== 'string') {
                    errors.push(`${currentPath} must be a string`);
                } else if (expectedType === 'number' && typeof value !== 'number') {
                    errors.push(`${currentPath} must be a number`);
                } else if (expectedType === 'array' && !Array.isArray(value)) {
                    errors.push(`${currentPath} must be an array`);
                } else if (expectedType === 'object' && (typeof value !== 'object' || value === null)) {
                    errors.push(`${currentPath} must be an object`);
                }
            }
        }
        
        validate(data, schema);
        return { isValid: errors.length === 0, errors };
    }
}

module.exports = Validators;
