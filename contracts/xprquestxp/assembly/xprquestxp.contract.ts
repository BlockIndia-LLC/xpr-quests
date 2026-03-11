import {
  Name,
  Table,
  Contract,
  TableStore,
  check,
  requireAuth,
  isAccount,
  currentTimeSec,
  EMPTY_NAME,
} from "proton-tsc";

// ─────────────────────────────────────────────
//  Tables
// ─────────────────────────────────────────────

@table("accounts")
class XPAccount extends Table {
  constructor(
    public user: Name = EMPTY_NAME,
    public lifetime_xp: u64 = 0,
    public spendable_xp: u64 = 0,
    public level: u16 = 0,
    public tier: u8 = 0,
    public kyc_verified: boolean = false,
    public xp_multiplier: u16 = 100,
    public joined_at: u64 = 0,
  ) {
    super();
  }

  @primary
  get primary(): u64 {
    return this.user.N;
  }

  set primary(value: u64) {
    this.user = Name.fromU64(value);
  }
}

@table("skillxp")
class SkillXP extends Table {
  constructor(
    public skill_tree: Name = EMPTY_NAME,
    public xp: u64 = 0,
    public tree_level: u16 = 0,
    public quests_completed: u32 = 0,
  ) {
    super();
  }

  @primary
  get primary(): u64 {
    return this.skill_tree.N;
  }

  set primary(value: u64) {
    this.skill_tree = Name.fromU64(value);
  }
}

@table("seasonxp")
class SeasonXP extends Table {
  constructor(
    public user: Name = EMPTY_NAME,
    public xp: u64 = 0,
    public rank: u32 = 0,
  ) {
    super();
  }

  @primary
  get primary(): u64 {
    return this.user.N;
  }

  set primary(value: u64) {
    this.user = Name.fromU64(value);
  }
}

@table("xpconfig")
class XPConfig extends Table {
  constructor(
    public id: u64 = 0,
    public admin: Name = EMPTY_NAME,
    public quest_contract: Name = EMPTY_NAME,
  ) {
    super();
  }

  @primary
  get primary(): u64 {
    return this.id;
  }

  set primary(value: u64) {
    this.id = value;
  }
}

// ─────────────────────────────────────────────
//  Helper – integer square root (floor)
// ─────────────────────────────────────────────

function isqrt(n: u64): u64 {
  if (n == 0) return 0;
  let x: u64 = n;
  let y: u64 = (x + 1) / 2;
  while (y < x) {
    x = y;
    y = (x + n / x) / 2;
  }
  return x;
}

// ─────────────────────────────────────────────
//  Tier thresholds
// ─────────────────────────────────────────────

function tierFromLevel(level: u16): u8 {
  if (level >= 50) return 5; // Legendary
  if (level >= 30) return 4; // Epic
  if (level >= 15) return 3; // Rare
  if (level >= 5) return 2;  // Uncommon
  return 1;                  // Common
}

// ─────────────────────────────────────────────
//  Contract
// ─────────────────────────────────────────────

@contract
class XprQuestXP extends Contract {
  accountsTable: TableStore<XPAccount> = new TableStore<XPAccount>(this.receiver);
  configTable: TableStore<XPConfig> = new TableStore<XPConfig>(this.receiver);

  // ── helpers ────────────────────────────────
  private getConfig(): XPConfig {
    const cfg = this.configTable.get(0);
    check(cfg != null, "contract not configured – call setconfig first");
    return cfg!;
  }

  private getSkillTable(user: Name): TableStore<SkillXP> {
    return new TableStore<SkillXP>(user);
  }

  private getSeasonTable(season_id: u32): TableStore<SeasonXP> {
    return new TableStore<SeasonXP>(Name.fromU64(<u64>season_id));
  }

  private computeLevel(lifetime_xp: u64): u16 {
    // level = floor(sqrt(lifetime_xp / 100)), capped at u16 max
    if (lifetime_xp < 100) return 0;
    const raw = isqrt(lifetime_xp / 100);
    return raw > <u64>u16.MAX_VALUE ? u16.MAX_VALUE : <u16>raw;
  }

  // ── actions ────────────────────────────────

  /**
   * Set admin and the authorized quest contract.
   * Requires contract-level authority.
   */
  @action("setconfig")
  setConfig(admin: Name, quest_contract: Name): void {
    requireAuth(this.receiver);
    check(isAccount(admin), "admin account does not exist");
    check(isAccount(quest_contract), "quest_contract account does not exist");

    let cfg = this.configTable.get(0);
    if (cfg == null) {
      cfg = new XPConfig(0, admin, quest_contract);
    } else {
      cfg!.admin = admin;
      cfg!.quest_contract = quest_contract;
    }
    this.configTable.set(cfg!, this.receiver);
  }

  /**
   * Add XP to a user. Only callable by the authorized quest_contract.
   *
   * Applies the user's xp_multiplier (100 = 1x, 150 = 1.5x).
   * Updates lifetime_xp, spendable_xp, level, tier, skill tree, and season XP.
   */
  @action("addxp")
  addXP(user: Name, amount: u32, skill_tree: Name, season_id: u32): void {
    const cfg = this.getConfig();
    requireAuth(cfg.quest_contract);
    check(isAccount(user), "user account does not exist");
    check(amount > 0, "amount must be greater than 0");

    // ── user account ──────────────────────────
    let account = this.accountsTable.get(user.N);
    if (account == null) {
      account = new XPAccount(
        user,
        0,  // lifetime_xp
        0,  // spendable_xp
        0,  // level
        1,  // tier – Common
        false, // kyc_verified
        100,   // xp_multiplier – 1x
        currentTimeSec(),
      );
    }

    // Apply multiplier: boosted = amount * multiplier / 100
    const boosted: u64 = (<u64>amount * <u64>account!.xp_multiplier) / 100;

    // Overflow guards
    check(account!.lifetime_xp <= u64.MAX_VALUE - boosted, "lifetime_xp overflow");
    check(account!.spendable_xp <= u64.MAX_VALUE - boosted, "spendable_xp overflow");

    account!.lifetime_xp += boosted;
    account!.spendable_xp += boosted;
    account!.level = this.computeLevel(account!.lifetime_xp);
    account!.tier = tierFromLevel(account!.level);

    this.accountsTable.set(account!, this.receiver);

    // ── skill tree ────────────────────────────
    if (skill_tree != EMPTY_NAME) {
      const skillTable = this.getSkillTable(user);
      let skill = skillTable.get(skill_tree.N);

      if (skill == null) {
        skill = new SkillXP(skill_tree, 0, 0, 0);
      }

      skill!.xp += boosted;
      skill!.quests_completed += 1;
      skill!.tree_level = <u16>isqrt(skill!.xp / 100);
      skillTable.set(skill!, this.receiver);
    }

    // ── season XP ─────────────────────────────
    if (season_id > 0) {
      const seasonTable = this.getSeasonTable(season_id);
      let seasonEntry = seasonTable.get(user.N);

      if (seasonEntry == null) {
        seasonEntry = new SeasonXP(user, 0, 0);
      }

      seasonEntry!.xp += boosted;
      seasonTable.set(seasonEntry!, this.receiver);
    }
  }

  /**
   * Spend spendable XP. Only the user themselves can spend their XP.
   * Does NOT reduce lifetime_xp (soulbound reputation stays).
   */
  @action("spendxp")
  spendXP(user: Name, amount: u64): void {
    requireAuth(user);
    check(amount > 0, "amount must be greater than 0");

    const account = this.accountsTable.get(user.N);
    check(account != null, "account does not exist");
    check(account!.spendable_xp >= amount, "insufficient spendable XP");

    account!.spendable_xp -= amount;
    this.accountsTable.set(account!, this.receiver);
  }

  /**
   * Set the XP multiplier and KYC verification status for a user.
   * Only the admin can call this action.
   *
   * multiplier is expressed in basis-100: 100 = 1x, 150 = 1.5x, 200 = 2x
   */
  @action("setmultiplr")
  setMultiplier(user: Name, multiplier: u16, kyc_verified: boolean): void {
    const cfg = this.getConfig();
    requireAuth(cfg.admin);
    check(isAccount(user), "user account does not exist");
    check(multiplier > 0, "multiplier must be greater than 0");
    check(multiplier <= 500, "multiplier cannot exceed 500 (5x)");

    let account = this.accountsTable.get(user.N);
    if (account == null) {
      account = new XPAccount(
        user,
        0,     // lifetime_xp
        0,     // spendable_xp
        0,     // level
        1,     // tier
        kyc_verified,
        multiplier,
        currentTimeSec(),
      );
    } else {
      account!.xp_multiplier = multiplier;
      account!.kyc_verified = kyc_verified;
    }

    this.accountsTable.set(account!, this.receiver);
  }

  // ─────────────────────────────────────────
  //  IMPORTANT: NO TRANSFER ACTION
  //  XP is soulbound – it cannot be transferred between accounts.
  // ─────────────────────────────────────────
}
