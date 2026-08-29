package com.monarca.audit.repository

import org.jetbrains.exposed.v1.core.Table

object AuditLogsTable : Table("audit_logs") {
    val id = varchar("id", 36)
    val auditTableName = varchar("table_name", 80)
    val recordId = varchar("record_id", 80)
    val action = varchar("action", 20)
    val oldValues = text("old_values").nullable()
    val newValues = text("new_values").nullable()
    val userId = long("user_id").nullable()
    val createdAt = long("created_at")

    override val primaryKey = PrimaryKey(id)
}
