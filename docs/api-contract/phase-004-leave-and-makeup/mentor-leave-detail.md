# S3 — Mentor detail and withdrawal

`GET /mentor/leave-requests/:requestId; POST /mentor/leave-requests/:requestId/withdraw`

GET uses page/pageSize; itemCount is the pagination total. Leave items have no wire id: sourceSessionId is the stable view key. Withdrawal body expectedVersion/reason and Idempotency-Key; response LeaveRequestDto WITHDRAWN.

See [common contract and verification](README.md) and the linked backend snapshot.
