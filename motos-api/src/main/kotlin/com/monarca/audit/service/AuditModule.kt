package com.monarca.audit.service

import com.monarca.audit.repository.AuditRepository
import com.monarca.audit.repository.ExposedAuditRepository
import org.koin.dsl.module

val auditModule = module {
    single<AuditRepository> { ExposedAuditRepository(get()) }
    single { AuditService(get()) }
}
