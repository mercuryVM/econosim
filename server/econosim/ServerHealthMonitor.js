// Monitor de saúde do servidor em tempo real
const fs = require('fs');
const path = require('path');

class ServerHealthMonitor {
    constructor(server) {
        this.server = server;
        this.metrics = {
            startTime: Date.now(),
            totalConnections: 0,
            activeConnections: 0,
            totalRounds: 0,
            errorCount: 0,
            lastError: null,
            memoryUsage: process.memoryUsage(),
            securityEvents: 0
        };
        
        this.alerts = [];
        this.thresholds = {
            maxErrorsPerHour: 50,
            maxMemoryMB: 500,
            maxInvalidRequestsPerClient: 10,
            maxRapidConnections: 5
        };

        this.startMonitoring();
    }

    startMonitoring() {
        // Monitoramento a cada 30 segundos
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
            this.checkThresholds();
            this.updateHealthStatus();
        }, 30000);

        // Log de saúde a cada 5 minutos
        this.healthLogInterval = setInterval(() => {
            this.logHealthStatus();
        }, 300000);

        console.log('🏥 Server Health Monitor started');
    }

    collectMetrics() {
        try {
            // Métricas básicas do servidor
            this.metrics.activeConnections = Object.keys(this.server.clients || {}).length;
            this.metrics.totalRounds = this.server.currentRound || 0;
            this.metrics.memoryUsage = process.memoryUsage();
            
            // Métricas de segurança se disponível
            if (this.server.securityLogger) {
                const securityReport = this.server.securityLogger.getSecurityReport();
                this.metrics.securityEvents = securityReport.activeClientMetrics || 0;
            }

            // CPU usage (aproximado)
            this.metrics.cpuUsage = process.cpuUsage();
            
        } catch (error) {
            this.recordError('Failed to collect metrics', error);
        }
    }

    checkThresholds() {
        const alerts = [];

        // Verificar uso de memória
        const memoryMB = this.metrics.memoryUsage.heapUsed / 1024 / 1024;
        if (memoryMB > this.thresholds.maxMemoryMB) {
            alerts.push({
                level: 'WARNING',
                type: 'HIGH_MEMORY_USAGE',
                message: `Memory usage is ${memoryMB.toFixed(1)}MB (threshold: ${this.thresholds.maxMemoryMB}MB)`,
                value: memoryMB,
                threshold: this.thresholds.maxMemoryMB,
                timestamp: Date.now()
            });
        }

        // Verificar taxa de erros
        const hoursRunning = (Date.now() - this.metrics.startTime) / (1000 * 60 * 60);
        const errorRate = this.metrics.errorCount / Math.max(hoursRunning, 1);
        if (errorRate > this.thresholds.maxErrorsPerHour) {
            alerts.push({
                level: 'ERROR',
                type: 'HIGH_ERROR_RATE',
                message: `Error rate is ${errorRate.toFixed(1)} errors/hour (threshold: ${this.thresholds.maxErrorsPerHour})`,
                value: errorRate,
                threshold: this.thresholds.maxErrorsPerHour,
                timestamp: Date.now()
            });
        }

        // Verificar eventos de segurança
        if (this.metrics.securityEvents > this.thresholds.maxInvalidRequestsPerClient) {
            alerts.push({
                level: 'WARNING',
                type: 'SECURITY_EVENTS',
                message: `High number of security events detected: ${this.metrics.securityEvents}`,
                value: this.metrics.securityEvents,
                threshold: this.thresholds.maxInvalidRequestsPerClient,
                timestamp: Date.now()
            });
        }

        // Adicionar novos alertas
        alerts.forEach(alert => this.addAlert(alert));
    }

    addAlert(alert) {
        this.alerts.push(alert);
        
        // Manter apenas os últimos 100 alertas
        if (this.alerts.length > 100) {
            this.alerts = this.alerts.slice(-100);
        }

        // Log do alerta
        console.log(`🚨 [${alert.level}] ${alert.type}: ${alert.message}`);
        
        // Log em arquivo se for crítico
        if (alert.level === 'ERROR' || alert.level === 'CRITICAL') {
            this.logAlert(alert);
        }
    }

    logAlert(alert) {
        try {
            const logFile = path.join(__dirname, 'health_alerts.log');
            const logEntry = `${new Date(alert.timestamp).toISOString()} [${alert.level}] ${alert.type}: ${alert.message}\n`;
            fs.appendFileSync(logFile, logEntry);
        } catch (error) {
            console.error('Failed to log alert:', error);
        }
    }

    recordError(message, error) {
        this.metrics.errorCount++;
        this.metrics.lastError = {
            message,
            error: error.message,
            stack: error.stack,
            timestamp: Date.now()
        };

        this.addAlert({
            level: 'ERROR',
            type: 'SERVER_ERROR',
            message: `${message}: ${error.message}`,
            timestamp: Date.now()
        });
    }

    updateHealthStatus() {
        const now = Date.now();
        const uptime = now - this.metrics.startTime;
        const memoryMB = this.metrics.memoryUsage.heapUsed / 1024 / 1024;
        
        // Calcular status geral
        let status = 'HEALTHY';
        let score = 100;

        // Penalizar por uso de memória
        if (memoryMB > this.thresholds.maxMemoryMB * 0.8) {
            score -= 20;
            status = 'WARNING';
        }

        // Penalizar por erros recentes
        const recentErrors = this.alerts.filter(alert => 
            alert.level === 'ERROR' && now - alert.timestamp < 300000 // últimos 5 min
        ).length;

        if (recentErrors > 0) {
            score -= recentErrors * 10;
            status = recentErrors > 3 ? 'CRITICAL' : 'WARNING';
        }

        // Penalizar por eventos de segurança
        if (this.metrics.securityEvents > 5) {
            score -= 15;
            status = 'WARNING';
        }

        this.metrics.healthStatus = {
            status,
            score: Math.max(0, score),
            uptime,
            lastUpdate: now
        };
    }

    getHealthReport() {
        const memoryMB = this.metrics.memoryUsage.heapUsed / 1024 / 1024;
        const uptimeHours = (Date.now() - this.metrics.startTime) / (1000 * 60 * 60);
        
        return {
            status: this.metrics.healthStatus?.status || 'UNKNOWN',
            score: this.metrics.healthStatus?.score || 0,
            uptime: {
                milliseconds: Date.now() - this.metrics.startTime,
                hours: uptimeHours.toFixed(2),
                formatted: this.formatUptime(uptimeHours)
            },
            connections: {
                active: this.metrics.activeConnections,
                total: this.metrics.totalConnections
            },
            performance: {
                memoryUsageMB: memoryMB.toFixed(1),
                memoryUsagePercent: ((memoryMB / this.thresholds.maxMemoryMB) * 100).toFixed(1),
                errorCount: this.metrics.errorCount,
                errorRate: (this.metrics.errorCount / Math.max(uptimeHours, 1)).toFixed(2)
            },
            security: {
                eventsCount: this.metrics.securityEvents,
                recentAlerts: this.alerts.filter(alert => 
                    Date.now() - alert.timestamp < 3600000 // última hora
                ).length
            },
            game: {
                currentRound: this.metrics.totalRounds,
                gameStarted: this.server.started || false
            },
            alerts: this.alerts.slice(-10), // últimos 10 alertas
            lastError: this.metrics.lastError,
            timestamp: Date.now()
        };
    }

    formatUptime(hours) {
        if (hours < 1) {
            return `${Math.floor(hours * 60)} minutes`;
        } else if (hours < 24) {
            return `${Math.floor(hours)} hours`;
        } else {
            const days = Math.floor(hours / 24);
            const remainingHours = Math.floor(hours % 24);
            return `${days} days, ${remainingHours} hours`;
        }
    }

    logHealthStatus() {
        const report = this.getHealthReport();
        console.log(`
🏥 SERVER HEALTH STATUS - ${new Date().toISOString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: ${report.status} (Score: ${report.score}/100)
Uptime: ${report.uptime.formatted}
Active Connections: ${report.connections.active}
Memory Usage: ${report.performance.memoryUsageMB}MB (${report.performance.memoryUsagePercent}%)
Error Rate: ${report.performance.errorRate} errors/hour
Security Events: ${report.security.eventsCount}
Recent Alerts: ${report.security.recentAlerts}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `);
    }

    // Parar monitoramento
    stop() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        if (this.healthLogInterval) {
            clearInterval(this.healthLogInterval);
        }
        console.log('🏥 Server Health Monitor stopped');
    }

    // Registrar conexão
    onConnection() {
        this.metrics.totalConnections++;
        this.metrics.activeConnections++;
    }

    // Registrar desconexão
    onDisconnection() {
        this.metrics.activeConnections = Math.max(0, this.metrics.activeConnections - 1);
    }

    // Registrar novo round
    onNewRound() {
        this.metrics.totalRounds++;
    }
}

module.exports = ServerHealthMonitor;
