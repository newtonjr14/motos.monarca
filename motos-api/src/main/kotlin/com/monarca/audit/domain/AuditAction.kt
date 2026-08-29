package com.monarca.audit.domain

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class AuditAction {
    @SerialName("INSERT")
    INSERT,

    @SerialName("UPDATE")
    UPDATE,

    @SerialName("SOFT_DELETE")
    SOFT_DELETE,

    @SerialName("RESTORE")
    RESTORE,
}
