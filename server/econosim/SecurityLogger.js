// Sistema de logging para monitoramento de segurança
const fs = require('fs');
const path = require('path');

class SecurityLogger {
    constructor() {
        this.logFile = path.join(__dirname, 'security.log');
        this.warningThresholds = {
            invalidRequests: 10, // Máximo de requests inválidos por cliente
            rapidConnections: 5   // Máximo de conexões rápidas por IP
        };
        this.clientMetrics = new Map(); // Métricas por cliente
        this.ipMetrics = new Map();     // Métricas por IP
        this.cleanupInterval = setInterval(() => this.cleanup(), 300000); // Cleanup a cada 5 minutos
    }

    // Log de eventos de segurança
    logSecurityEvent(level, message, details = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            details
        };

        const logLine = JSON.stringify(logEntry) + '\n';
        
        try {
            fs.appendFileSync(this.logFile, logLine);
        } catch (error) {
            console.error('Failed to write to security log:', error);
        }

        // Log também no console para desenvolvimento
        if (level === 'CRITICAL' || level === 'ERROR') {
            console.error(`[SECURITY ${level}] ${message}`, details);
        } else if (level === 'WARNING') {
            console.warn(`[SECURITY ${level}] ${message}`, details);
        } else {
            console.log(`[SECURITY ${level}] ${message}`, details);
        }
    }

    // Rastrear request inválido
    trackInvalidRequest(clientId, ip, requestType) {
        const key = clientId || ip;
        if (!this.clientMetrics.has(key)) {
            this.clientMetrics.set(key, {
                invalidRequests: 0,
                firstInvalidRequest: Date.now(),
                ip: ip
            });
        }

        const metrics = this.clientMetrics.get(key);
        metrics.invalidRequests++;

        if (metrics.invalidRequests >= this.warningThresholds.invalidRequests) {
            this.logSecurityEvent('WARNING', 'Client exceeded invalid request threshold', {
                clientId,
                ip,
                requestType,
                invalidRequestCount: metrics.invalidRequests,
                timeWindow: Date.now() - metrics.firstInvalidRequest
            });
        } else {
            this.logSecurityEvent('INFO', 'Invalid request tracked', {
                clientId,
                ip,
                requestType,
                invalidRequestCount: metrics.invalidRequests
            });
        }
    }

    // Rastrear conexão
    trackConnection(ip, clientId) {
        if (!this.ipMetrics.has(ip)) {
            this.ipMetrics.set(ip, {
                connections: 0,
                firstConnection: Date.now(),
                recentConnections: []
            });
        }

        const metrics = this.ipMetrics.get(ip);
        const now = Date.now();
        
        // Remover conexões antigas (mais de 1 minuto)
        metrics.recentConnections = metrics.recentConnections.filter(
            time => now - time < 60000
        );
        
        metrics.recentConnections.push(now);
        metrics.connections++;

        if (metrics.recentConnections.length >= this.warningThresholds.rapidConnections) {
            this.logSecurityEvent('WARNING', 'Rapid connections detected from IP', {
                ip,
                clientId,
                connectionsInLastMinute: metrics.recentConnections.length,
                totalConnections: metrics.connections
            });
        } else {
            this.logSecurityEvent('INFO', 'Connection tracked', {
                ip,
                clientId,
                totalConnections: metrics.connections
            });
        }
    }

    // Rastrear desconexão anormal
    trackAbnormalDisconnection(clientId, ip, reason) {
        this.logSecurityEvent('WARNING', 'Abnormal client disconnection', {
            clientId,
            ip,
            reason,
            timestamp: Date.now()
        });
    }

    // Rastrear tentativa de acesso negado
    trackAccessDenied(ip, reason, attemptedAction) {
        this.logSecurityEvent('ERROR', 'Access denied', {
            ip,
            reason,
            attemptedAction,
            timestamp: Date.now()
        });
    }

    // Rastrear erro crítico do servidor
    trackCriticalError(error, context) {
        this.logSecurityEvent('CRITICAL', 'Critical server error', {
            error: error.message,
            stack: error.stack,
            context,
            timestamp: Date.now()
        });
    }

    // Limpeza de métricas antigas
    cleanup() {
        const now = Date.now();
        const maxAge = 3600000; // 1 hora

        // Limpar métricas de clientes antigas
        for (const [key, metrics] of this.clientMetrics.entries()) {
            if (now - metrics.firstInvalidRequest > maxAge) {
                this.clientMetrics.delete(key);
            }
        }

        // Limpar métricas de IP antigas
        for (const [ip, metrics] of this.ipMetrics.entries()) {
            if (now - metrics.firstConnection > maxAge) {
                this.ipMetrics.delete(ip);
            }
        }

        this.logSecurityEvent('INFO', 'Metrics cleanup completed', {
            clientMetricsCount: this.clientMetrics.size,
            ipMetricsCount: this.ipMetrics.size
        });
    }

    // Obter relatório de segurança
    getSecurityReport() {
        const report = {
            timestamp: new Date().toISOString(),
            activeClientMetrics: this.clientMetrics.size,
            activeIpMetrics: this.ipMetrics.size,
            topOffenders: []
        };

        // Encontrar os principais infratores
        for (const [key, metrics] of this.clientMetrics.entries()) {
            if (metrics.invalidRequests > 0) {
                report.topOffenders.push({
                    identifier: key,
                    ip: metrics.ip,
                    invalidRequests: metrics.invalidRequests,
                    firstInvalidRequest: new Date(metrics.firstInvalidRequest).toISOString()
                });
            }
        }

        // Ordenar por número de requests inválidos
        report.topOffenders.sort((a, b) => b.invalidRequests - a.invalidRequests);
        report.topOffenders = report.topOffenders.slice(0, 10); // Top 10

        return report;
    }

    // Destrutor para limpeza
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.logSecurityEvent('INFO', 'SecurityLogger destroyed');
    }
}

module.exports = SecurityLogger;
