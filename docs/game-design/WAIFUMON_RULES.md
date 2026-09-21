# Waifumon / Telegram Mini App monetization rules

## Scope

This document defines the client/server boundary for the optional Telegram Mini App distribution layer.

It does not replace the Godot game economy, PlayerProgressStore, RewardTransactionService, gacha tables, campaign reward authority, or baseball resolvers.

The Telegram Mini App is a presentation and transport client. It must never decide:
- paid entitlement ownership;
- reward amount;
- gacha result;
- pity state;
- character rarity;
- combat result;
- energy restoration;
- referral reward eligibility.

## 1. Telegram Stars purchase strategy

Telegram Stars are treated as a platform payment rail for optional digital purchases.

Production flow:

Telegram Mini App
→ backend purchase intent
→ Telegram payment flow
→ server-side verification
→ idempotent entitlement grant
→ audit record

The web client should only:
1. display a product supplied by the authoritative service;
2. request creation of a purchase intent;
3. receive a server-issued purchase state;
4. refresh entitlements after the authoritative service confirms payment.

The web client must never grant an item merely because a payment UI appears to have completed locally.

### Required server-side controls

Every purchase must have:
- a unique purchase intent ID;
- a product SKU;
- a server-side price definition;
- an account/Telegram identity binding;
- an idempotency key;
- a persisted payment state;
- an entitlement transaction ID;
- a replay-safe confirmation path.

A failed or repeated callback must not duplicate a reward.

### Economy separation

Paid purchases may create explicit entitlements such as premium currency, cosmetic bundles, account passes, or optional energy packs.

The entitlement service must call the same reward authority used by the game. Telegram-specific code must not mutate PlayerProgressStore directly.

### Platform note

Telegram payment, Stars, Bot API, Mini App, store, and legal requirements can change. Before commercial release, the implementation must be checked against the then-current official Telegram documentation and applicable platform requirements.

## 2. Referral strategy

Referral data is an acquisition signal, not a client-controlled reward command.

Production flow:

Telegram start parameter
→ backend attribution record
→ validation
→ one-time referral binding
→ qualified event
→ reward transaction

The client may report:
- start parameter;
- signed platform identity material supplied to the backend;
- session metadata required for attribution.

The client must not decide:
- whether a referral is valid;
- whether the inviter receives a reward;
- how many rewards exist;
- whether the same user can be counted repeatedly.

### Anti-abuse rules

The authoritative service should reject or quarantine:
- self-referrals;
- repeated referral claims from the same account;
- suspicious account farms;
- replayed referral events;
- duplicate attribution after a user has already been bound;
- client timestamps that attempt to rewrite server order.

### Rewarding

Referral rewards must use an explicit transaction:

validated referral
→ reward payload
→ RewardTransactionService
→ persisted entitlement

This keeps referrals consistent with campaign and rewarded-ad transactions.

## 3. Telegram identity and trust boundary

Telegram.WebApp.initDataUnsafe is useful for presentation but must not be treated as proof of identity, entitlement, or payment.

For privileged server actions:
1. send the platform initialization material through the secure transport selected by the backend;
2. validate it server-side according to the current official Telegram verification procedure;
3. bind the resulting trusted identity to the game account;
4. issue the server-side authorization decision.

## 4. Web client rules

webapp/ is intentionally stateless with respect to authoritative game economy.

The client can:
- render combat DTOs;
- request turn actions;
- display products;
- open Telegram UI;
- report referral metadata.

The client cannot:
- write reward tables;
- alter rarity;
- alter pity;
- mutate an authoritative save;
- determine baseball results.

## 5. Current repository status

The repository now contains the frontend contract, canvas renderer, asset staging path, and GitHub Pages deployment pipeline.

A production backend, payment verifier, referral service, or authoritative web economy service is not created by this document.

Any future server implementation must preserve this hierarchy:

trusted platform identity
→ backend rules
→ gameplay/reward services
→ DTO
→ web presentation
