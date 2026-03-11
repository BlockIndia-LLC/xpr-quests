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
  Action,
  PermissionLevel,
} from "proton-tsc";

// ─────────────────────────────────────────────
//  Tables
// ─────────────────────────────────────────────

@table("seasons")
class Season extends Table {
  constructor(
    public season_id: u64 = 0,
    public title: string = "",
    public start_time: u64 = 0,
    public end_time: u64 = 0,
    public reward_pool: string = "",    // e.g. "10000.0000 XPR"
    public status: u8 = 0,             // 0=upcoming, 1=active, 2=ended, 3=distributed
    public created_at: u64 = 0,
  ) {
    super();
  }

  @primary
  get primary(): u64 {
    return this.season_id;
  }

  set primary(value: u64) {
    this.season_id = value;
  }
}

@table("leaderboard")
class LeaderboardEntry extends Table {
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

@table("rewards")
class Reward extends Table {
  constructor(
    public user: Name = EMPTY_NAME,
    public amount: string = "",     // e.g. "300.0000 XPR"
    public claimed: boolean = false,
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

@table("sznconfig")
class SeasonConfig extends Table {
  constructor(
    public id: u64 = 0,
    public admin: Name = EMPTY_NAME,
    public xp_contract: Name = EMPTY_NAME,
    public next_season_id: u64 = 1,
    public token_contract: Name = EMPTY_NAME,
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
//  Contract
// ─────────────────────────────────────────────

@contract
class XprSeasons extends Contract {
  seasonsTable: TableStore<Season> = new TableStore<Season>(this.receiver);
  configTable: TableStore<SeasonConfig> = new TableStore<SeasonConfig>(this.receiver);

  // ── helpers ────────────────────────────────
  private getConfig(): SeasonConfig {
    const cfg = this.configTable.get(0);
    check(cfg != null, "contract not configured – call setconfig first");
    return cfg!;
  }

  private saveConfig(cfg: SeasonConfig): void {
    this.configTable.set(cfg, this.receiver);
  }

  private getLeaderboardTable(season_id: u64): TableStore<LeaderboardEntry> {
    return new TableStore<LeaderboardEntry>(Name.fromU64(season_id));
  }

  private getRewardsTable(season_id: u64): TableStore<Reward> {
    return new TableStore<Reward>(Name.fromU64(season_id));
  }

  // ── actions ────────────────────────────────

  /**
   * Set admin and XP contract. Requires contract-level authority.
   */
  @action("setconfig")
  setConfig(admin: Name, xp_contract: Name, token_contract: Name): void {
    requireAuth(this.receiver);
    check(isAccount(admin), "admin account does not exist");
    check(isAccount(xp_contract), "xp_contract account does not exist");
    check(isAccount(token_contract), "token_contract account does not exist");

    let cfg = this.configTable.get(0);
    if (cfg == null) {
      cfg = new SeasonConfig(0, admin, xp_contract, 1, token_contract);
    } else {
      cfg!.admin = admin;
      cfg!.xp_contract = xp_contract;
      cfg!.token_contract = token_contract;
    }
    this.configTable.set(cfg!, this.receiver);
  }

  /**
   * Create a new season. Admin only.
   */
  @action("createseason")
  createSeason(
    title: string,
    start_time: u64,
    end_time: u64,
    reward_pool: string,
  ): void {
    const cfg = this.getConfig();
    requireAuth(cfg.admin);

    check(title.length > 0, "title cannot be empty");
    check(start_time > currentTimeSec(), "start_time must be in the future");
    check(end_time > start_time, "end_time must be after start_time");
    check(reward_pool.length > 0, "reward_pool cannot be empty");

    const seasonId = cfg.next_season_id;
    const season = new Season(
      seasonId,
      title,
      start_time,
      end_time,
      reward_pool,
      0, // upcoming
      currentTimeSec(),
    );

    this.seasonsTable.store(season, this.receiver);

    cfg.next_season_id = seasonId + 1;
    this.saveConfig(cfg);
  }

  /**
   * Start a season (status 0 -> 1). Admin only.
   */
  @action("startseason")
  startSeason(season_id: u64): void {
    const cfg = this.getConfig();
    requireAuth(cfg.admin);

    const season = this.seasonsTable.get(season_id);
    check(season != null, "season does not exist");
    check(season!.status == 0, "season is not in upcoming status");

    season!.status = 1;
    this.seasonsTable.set(season!, this.receiver);
  }

  /**
   * End a season (status 1 -> 2). Admin only.
   */
  @action("endseason")
  endSeason(season_id: u64): void {
    const cfg = this.getConfig();
    requireAuth(cfg.admin);

    const season = this.seasonsTable.get(season_id);
    check(season != null, "season does not exist");
    check(season!.status == 1, "season is not active");

    season!.status = 2;
    this.seasonsTable.set(season!, this.receiver);
  }

  /**
   * Snapshot leaderboard entries from backend. Admin only.
   * Called after endseason to record final rankings.
   * Can be called multiple times to batch entries.
   */
  @action("snapshot")
  snapshot(
    season_id: u64,
    users: Name[],
    xps: u64[],
    ranks: u32[],
  ): void {
    const cfg = this.getConfig();
    requireAuth(cfg.admin);

    const season = this.seasonsTable.get(season_id);
    check(season != null, "season does not exist");
    check(season!.status == 2, "season must be ended before snapshot");
    check(users.length > 0, "users array cannot be empty");
    check(users.length == xps.length, "users and xps must have same length");
    check(users.length == ranks.length, "users and ranks must have same length");

    const leaderboard = this.getLeaderboardTable(season_id);

    for (let i = 0; i < users.length; i++) {
      // Prevent duplicate snapshot entries
      const existing = leaderboard.get(users[i].N);
      check(existing == null, "duplicate user in snapshot");

      const entry = new LeaderboardEntry(users[i], xps[i], ranks[i]);
      leaderboard.set(entry, this.receiver);
    }
  }

  /**
   * Distribute rewards by writing reward amounts to the rewards table.
   * Admin only. Sets status to 3 (distributed).
   * The actual XPR transfer happens when users call claimseasonrwd.
   */
  @action("distribute")
  distribute(
    season_id: u64,
    users: Name[],
    amounts: string[],
  ): void {
    const cfg = this.getConfig();
    requireAuth(cfg.admin);

    const season = this.seasonsTable.get(season_id);
    check(season != null, "season does not exist");
    check(season!.status == 2, "season must be ended before distribution");
    check(users.length > 0, "users array cannot be empty");
    check(users.length == amounts.length, "users and amounts must have same length");

    const rewardsTable = this.getRewardsTable(season_id);

    for (let i = 0; i < users.length; i++) {
      const reward = new Reward(users[i], amounts[i], false);
      rewardsTable.set(reward, this.receiver);
    }

    season!.status = 3;
    this.seasonsTable.set(season!, this.receiver);
  }

  /**
   * User claims their season reward. Sends inline eosio.token::transfer.
   */
  @action("claimseasonrwd")
  claimSeasonReward(user: Name, season_id: u64): void {
    requireAuth(user);

    const season = this.seasonsTable.get(season_id);
    check(season != null, "season does not exist");
    check(season!.status == 3, "rewards have not been distributed yet");

    const rewardsTable = this.getRewardsTable(season_id);
    const reward = rewardsTable.get(user.N);
    check(reward != null, "no reward found for this user");
    check(!reward!.claimed, "reward already claimed");

    reward!.claimed = true;
    rewardsTable.set(reward!, this.receiver);

    // Send inline token_contract::transfer
    const cfg = this.getConfig();
    check(cfg.token_contract != EMPTY_NAME, "token_contract not configured");
    const transferAction = Name.fromString("transfer");

    const transferData = new TransferActionData(
      this.receiver,   // from (contract)
      user,            // to (winner)
      reward!.amount,  // quantity
      `Season ${season_id} reward`,
    );

    const action = new Action(
      cfg.token_contract,
      transferAction,
      [new PermissionLevel(this.receiver, Name.fromString("active"))],
      transferData.pack(),
    );

    action.send();
  }
}

// ─────────────────────────────────────────────
//  Inline-action packing helper
// ─────────────────────────────────────────────

@packer
class TransferActionData {
  constructor(
    public from: Name = EMPTY_NAME,
    public to: Name = EMPTY_NAME,
    public quantity: string = "",
    public memo: string = "",
  ) {}
}
