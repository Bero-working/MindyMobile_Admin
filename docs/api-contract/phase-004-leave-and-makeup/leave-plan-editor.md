# S2 — Preview, slots and create

`POST /mentor/leave-requests/preview; POST /mentor/leave-requests/makeup-slots; POST /mentor/leave-requests`

Preview: fromDate/toDate/period. Slots: sourceSessionId/targetDate/targetPeriod. Both are reads despite POST; failures are safe read errors. Create: range, reason, sourceVersions, sessionMappings (no dayMappings). Required UUID Idempotency-Key. Session IDs and versions come from preview; noticeEligible/asOf/deadline and available slots come from server. Max 500 sources and mappings.

See [common contract and verification](README.md) and the linked backend snapshot.
