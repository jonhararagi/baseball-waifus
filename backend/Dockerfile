FROM node:20-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY backend/package.json ./backend/package.json
COPY backend/src ./backend/src
COPY webapp/js/combat_core.js ./webapp/js/combat_core.js
COPY webapp/js/reward_authority.js ./webapp/js/reward_authority.js
COPY webapp/js/player_meta_state.js ./webapp/js/player_meta_state.js
RUN node --check backend/src/server.mjs && node --check backend/src/config.mjs && node --check backend/src/auth.mjs && node --check backend/src/combat_service.mjs && node --check backend/src/persistent_combat_store.mjs && node --check backend/src/persistence_provider.mjs && node --check backend/src/attestation_signer.mjs
USER node
EXPOSE 8787
CMD ["node", "backend/src/server.mjs"]
