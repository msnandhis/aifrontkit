# ADR 0001: Three repository product boundary

Status: accepted, 2026-08-26.

AIFrontKit uses three repositories: public OSS behavior/community source, private Pro source, and the private commercial platform. Pro consumes released public primitives. The platform authorizes acquisition of Pro source. Neither relationship creates a customer-application runtime dependency.

This replaces the earlier two-repository plan that stored Pro assets with the platform. The split allows commercial UI to evolve and be reviewed without coupling source authorship to accounts, payments, or deployment infrastructure.
