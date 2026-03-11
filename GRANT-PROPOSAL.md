# XPR Network Grant Proposal

- **Project Name:** XPR Quests
- **Team Name:** Prem
- **Payment Address:** prem (XPR Network @name)
- **Level:** Company
- **Is Project Open-Source:** Yes
- **Project has a token:** No
- **Github Repo:** https://github.com/user/xpr-quests

## Contact Information

- **Contact Name:** Prem
- **Contact Email:** [your-email]
- **Website:** [your-website]

---

## Project Overview

### Tagline
The first gamification and quest platform on XPR Network — earn soulbound XP, collect NFT badges, and climb leaderboards by completing on-chain quests.

### Brief Description
XPR Quests is an on-chain quest, achievement, and reputation platform for the XPR Network blockchain. Users complete quests (swap tokens, stake, vote, mint NFTs, etc.), earn soulbound XP tied to their verified @name identity, collect NFT badges via AtomicAssets, and compete on seasonal leaderboards for XPR token rewards. It is the first gamification platform on XPR Network — no competing product exists.

### What problem does it solve?
XPR Network has strong infrastructure (zero-fee transactions, @name identity, Metal KYC) but lacks a gamification layer to:
1. **Onboard new users** — newcomers don't know what to do after creating a wallet
2. **Drive ecosystem engagement** — existing users have no incentive to explore new dApps
3. **Reward active participation** — there's no system to recognize and reward power users
4. **Measure reputation** — no on-chain reputation standard exists for the network

XPR Quests solves all four by creating guided, rewarded pathways through the ecosystem.

### Current Development Stage
**Fully built and functional.** The platform has been developed through 5 complete phases:
- Phase 1: Foundation (quests, XP, profiles, wallet connection)
- Phase 2: Skill trees, seasons, leaderboards, notifications
- Phase 3: Community quests, partner perks, admin dashboard
- Phase 4: On-chain integration, NFT badges, season rewards
- Phase 5: Security audit, design polish, mobile optimization

The application is ready for testnet deployment and community testing.

---

## Ecosystem Fit

### How does this fit into the XPR Network ecosystem?
XPR Quests is **ecosystem infrastructure** — it benefits every dApp on XPR Network by:
- Driving traffic to partner dApps through quest objectives (e.g., "Swap 100 XPR on Metal X")
- Increasing on-chain transaction volume (every quest completion = chain activity)
- Providing a reputation layer that other dApps can reference
- Leveraging XPR Network's unique strengths: zero fees, @name identity, Metal KYC

### Who is the target audience?
- **New users** who need guided onboarding into the XPR ecosystem
- **Existing users** who want gamified engagement and seasonal competition
- **dApp builders** who want to drive traffic via sponsored quests
- **Block producers** who benefit from increased chain activity and user retention

### What need does it meet?
No gamification or quest platform exists on XPR Network today. Competing L1s (e.g., Galxe on EVM chains, Layer3, Zealy) have proven that quest platforms dramatically increase user engagement and retention. XPR Quests brings this proven model to XPR Network, purpose-built for its unique identity and zero-fee architecture.

---

## Team

### Team Members
- **Prem** — Founder & developer, full-stack + smart contracts

### Relevant Experience
- Experienced in XPR Network smart contract development (proton-tsc)
- Full-stack development: Next.js, Node.js, PostgreSQL, Redis
- Familiar with WharfKit, WebAuth, AtomicAssets standards
- AI-augmented development workflow for rapid iteration

### Team LinkedIn/GitHub
- GitHub: [your-github]

---

## Development Roadmap

### Overview

| | Milestone 1 | Milestone 2 |
|---|---|---|
| **Duration** | 1 week | 2 weeks |
| **FTE** | 1 | 1 |
| **Cost** | $2,000 | $3,000 |

**Total Duration:** 3 weeks
**Total Cost:** $5,000 USD

---

### Milestone 1 — Testnet Launch & Community Beta

**Duration:** 1 week
**FTE:** 1
**Cost:** $2,000

| Number | Deliverable | Specification |
|---|---|---|
| 0a. | License | MIT (open-source) |
| 0b. | Documentation | Inline code docs, README with setup instructions, quest creation guide |
| 0c. | Article | Launch announcement article on Medium/Mirror covering platform features |
| 1. | Smart Contracts (Testnet) | Deploy `xprquests`, `xprquestxp`, `xprseasons` contracts to XPR Network testnet |
| 2. | Backend API | Hono API server with quest engine, XP calculator, leaderboard, season manager, WebSocket live updates |
| 3. | Frontend Application | Next.js 14 app with WebAuth wallet integration, quest browser, profile pages, skill trees, leaderboard, rewards shop, admin dashboard |
| 4. | Genesis Quests | 10+ onboarding quests across 4 skill trees (DeFi, Governance, NFT, Community) |
| 5. | Community Beta | Open beta on testnet, collect community feedback |

**Cost breakdown:**
- Infrastructure setup (Neon PostgreSQL, Upstash Redis, VPS hosting): $300
- Testnet contract deployment (RAM): $50
- Domain & SSL: $50
- Development refinements & beta bug fixes: $600
- Community outreach & beta testing coordination: $200
- AI tooling & development overhead: $800

---

### Milestone 2 — Mainnet Deploy & Season 1 Launch

**Duration:** 2 weeks
**FTE:** 1
**Cost:** $3,000

| Number | Deliverable | Specification |
|---|---|---|
| 1. | Smart Contracts (Mainnet) | Deploy all 3 audited contracts to XPR Network mainnet |
| 2. | NFT Badge Collection | Create AtomicAssets collection `xprquestbdg` with badge schema and 15+ badge templates for Season 1 quests |
| 3. | Season 1 Launch | 12-week competitive season with tiered XPR rewards |
| 4. | Season 1 Reward Pool | 1,000,000 XPR distributed to top 200 participants |
| 5. | KYC Multiplier | Metal Identity verified users receive 1.5x XP multiplier (anti-Sybil) |
| 6. | Hyperion Integration | Real-time on-chain action monitoring for automatic quest completion |
| 7. | Partner Integrations | Quests integrated with 2-3 XPR ecosystem dApps (Metal X, Storex, Soon.Market, etc.) |
| 8. | Community Quest Builder | Public quest creation tool — any verified user can propose quests (admin-approved) |

**Season 1 Reward Tiers:**

| Tier | Rank | Reward Per User | Users | Total XPR |
|---|---|---|---|---|
| Champion | 1st | 100,000 XPR | 1 | 100,000 |
| Elite | 2nd-5th | 50,000 XPR | 4 | 200,000 |
| Gold | 6th-20th | 15,000 XPR | 15 | 225,000 |
| Silver | 21st-50th | 5,000 XPR | 30 | 150,000 |
| Bronze | 51st-200th | 2,167 XPR | 150 | 325,000 |
| **Total** | | | **200** | **1,000,000 XPR** |

At current XPR price (~$0.0023): Season 1 pool ≈ **$2,300 USD**

**Additional excitement drivers (zero cost):**
- Exclusive Season 1 NFT badges (limited edition, never minted again)
- "Season 1 OG" permanent profile badge for all participants
- Partner perks unlocked by XP spending (negotiated with XPR ecosystem dApps)

**Cost breakdown:**
- Season 1 reward pool (1,000,000 XPR): ~$2,300
- Mainnet contract deployment (RAM): $100
- Infrastructure (6 months hosting pre-paid): $400
- Partner outreach & Season 2 preparation: $200

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Layer 4 — Frontend (Next.js 14 + WebAuth + TailwindCSS)│
│  Quest Browser │ Skill Trees │ Profile │ Leaderboards   │
├─────────────────────────────────────────────────────────┤
│  Layer 3 — Backend API (Hono + PostgreSQL + Redis)      │
│  Quest Engine │ XP Calculator │ Season Manager          │
│  Chain Sync Queue │ WebSocket Live Updates               │
├─────────────────────────────────────────────────────────┤
│  Layer 2 — Chain Indexer (Hyperion v2 API)              │
│  Action Filter │ Automatic Quest Completion Detection   │
├─────────────────────────────────────────────────────────┤
│  Layer 1 — XPR Network Smart Contracts (proton-tsc)     │
│  xprquests │ xprquestxp │ xprseasons │ atomicassets     │
└─────────────────────────────────────────────────────────┘
```

### Smart Contracts (3 contracts, security audited)
- **xprquests** — Quest registry, progress tracking, reward claims with inline NFT minting
- **xprquestxp** — Soulbound XP system with KYC multiplier, skill trees, season XP tracking
- **xprseasons** — Season lifecycle, on-chain leaderboard snapshots, token reward distribution

### Key Security Features (Implemented)
- Configurable contract references (no hardcoded contract names)
- XP reward cap (100,000 max per quest)
- Multiplier cap (5x max, prevents abuse)
- Integer overflow protection on all XP operations
- Status range validation (0-3 only)
- Prerequisite quest status verification
- Duplicate snapshot prevention
- Empty array validation on batch operations

### Tech Stack
- **Frontend:** Next.js 14, TailwindCSS, WharfKit + WebAuth Plugin, SWR, Zustand, Framer Motion
- **Backend:** Hono, Drizzle ORM, PostgreSQL, Redis (ioredis), WharfKit chain client
- **Contracts:** proton-tsc (AssemblyScript), tested with @proton/vert
- **Infrastructure:** Neon (PostgreSQL), Upstash (Redis)

---

## Future Plans

### Short-term (3-6 months)
- Partner-sponsored quests (dApps pay XP/rewards to drive traffic)
- Governance boost integration (XP influences voting weight via wrapper contract)
- Mobile-optimized PWA

### Long-term (6-12 months)
- Cross-chain quest support (if XPR Network bridges expand)
- Quest SDK for dApp developers to embed quests natively
- DAO-governed quest approval (community votes on quest quality)
- Self-sustaining revenue model through quest creation fees and partner sponsorships

### Promotion & Outreach
- Launch announcement on XPR Network social channels
- Tutorial videos for quest completion
- Weekly community challenges during Season 1
- Partnerships with existing XPR dApps for co-branded quests

---

## Additional Information

### Previous XPR Network Work
This is the first XPR Network grant application. The entire platform has been built prior to this proposal as a demonstration of commitment and capability.

### Why AI-assisted development enables rapid delivery
The development phase leveraged AI-augmented coding workflows, enabling a single developer to build a production-grade platform across 5 phases. The platform is already complete — the 3-week timeline covers testnet beta, community feedback, mainnet deployment, and Season 1 launch. No development from scratch is needed.

### Financial Transparency
- No external investors or funding sources
- No prior grant applications for this project
- All funds will be used as specified in the milestone breakdown
- Open-source codebase allows full transparency on deliverables

---

## Budget Summary

| Item | Cost |
|---|---|
| Season 1 reward pool (1,000,000 XPR) | ~$2,300 |
| Infrastructure (6 months hosting) | $700 |
| Contract deployments (testnet + mainnet RAM) | $150 |
| Development refinements & beta fixes | $600 |
| AI tooling & development overhead | $800 |
| Domain, SSL & misc | $50 |
| Community outreach & partnerships | $400 |
| **Total Grant Request** | **$5,000 USD** |

This falls under the **Company / Standard** tier (up to $5,000) of the XPR Grant Framework.
