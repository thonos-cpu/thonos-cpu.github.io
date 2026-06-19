# tasis.info

## Purpose

A personal engineering portfolio for Athanasios Tasis. Recruiters and technical peers should quickly understand the kind of systems he builds, inspect his public work without leaving the site, run a small code sample, and ask a tightly scoped portfolio assistant.

## Audiences

- Recruiters evaluating technical depth and communication.
- Engineers reviewing repositories and project tradeoffs.
- Friends, collaborators, and academic peers.
- Athanasios, privately reviewing traffic and tool usage.

## Public surfaces

- Portfolio landing page with experience, selected work, repository archive, compiler, ThanosGPT, capabilities, and contact.
- Privacy page with first-party analytics disclosure and opt-out control.

## Private surfaces

- `/admin/login`: administrator authentication.
- `/admin`: live visitors, historical traffic, engagement, popular pages/sections, GPT questions, and compiler submissions.

## Product principles

1. Technical substance before decoration.
2. Public pages remain fast, indexable, and useful without JavaScript-heavy effects.
3. Analytics are first-party, privacy-conscious, and historically durable.
4. Sensitive submissions are encrypted at rest and visible only to the administrator.
5. No secret, database credential, encryption key, or administrator credential is shipped to the browser or committed to Git.

## Register

The public portfolio uses the brand register: design is part of the product. The private analytics dashboard uses the product register: clarity, density, and fast scanning come first.
