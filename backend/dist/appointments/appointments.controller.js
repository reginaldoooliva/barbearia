"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
const appointments_service_1 = require("./appointments.service");
const create_appointment_dto_1 = require("./dto/create-appointment.dto");
const dashboard_stats_query_dto_1 = require("./dto/dashboard-stats-query.dto");
let AppointmentsController = class AppointmentsController {
    constructor(appointmentsService) {
        this.appointmentsService = appointmentsService;
    }
    disponibilidade(barbeiroId, data) {
        return this.appointmentsService.listarHorariosDisponiveis(barbeiroId, data);
    }
    agenda(data) {
        return this.appointmentsService.agendaDoDia(data);
    }
    stats(query) {
        return this.appointmentsService.estatisticasDashboard(query.dataInicio, query.dataFim);
    }
    criar(req, dto) {
        return this.appointmentsService.criarAgendamento(req.user.id, dto);
    }
    meus(req) {
        return this.appointmentsService.meusAgendamentos(req.user.id);
    }
    cancelar(req, id) {
        return this.appointmentsService.cancelar(req.user.id, id);
    }
};
exports.AppointmentsController = AppointmentsController;
__decorate([
    (0, common_1.Get)('disponibilidade'),
    __param(0, (0, common_1.Query)('barbeiroId')),
    __param(1, (0, common_1.Query)('data')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "disponibilidade", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.PROPRIETARIO),
    (0, common_1.Get)('agenda'),
    __param(0, (0, common_1.Query)('data')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "agenda", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.PROPRIETARIO),
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dashboard_stats_query_dto_1.DashboardStatsQueryDto]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "stats", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.CLIENTE),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_appointment_dto_1.CreateAppointmentDto]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "criar", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.CLIENTE),
    (0, common_1.Get)('meus'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "meus", null);
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.CLIENTE),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "cancelar", null);
exports.AppointmentsController = AppointmentsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('appointments'),
    __metadata("design:paramtypes", [appointments_service_1.AppointmentsService])
], AppointmentsController);
