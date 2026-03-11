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
  sendInlineAction,
} from "proton-tsc";

// ─────────────────────────────────────────────
//  Tables
// ─────────────────────────────────────────────

@table("quests")
class Quest extends Table {
  constructor(
    public quest_id: u64 = 0,
    public creator: Name = EMPTY_NAME,
    public title: string = "",
    public description: string = "",
    public quest_type: u8 = 0,
    public target_contract: Name = EMPTY_NAME,
    public target_action: Name = EMPTY_NAME,
    public target_params: string = "",
    public required_count: u32 = 0,
    public xp_reward: u32 = 0,
    public nft_template_id: i32 = -1,
    public nft_collection: Name = EMPTY_NAME,
    public skill_tree: Name = EMPTY_NAME,
    public prereq_quest_id: u64 = 0,
    public season_id: u32 = 0,
    public kyc_required: boolean = false,
    public min_account_age_hrs: u32 = 48,
    public max_completions: u32 = 0,
    public completed_count: u32 = 0,
    public status: u8 = 0,
    public created_at: u64 = 0,
  ) {
    super();
  }

  @primary
  get primary(): u64 {
    return this.quest_id;
  }

  set primary(value: u64) {
    this.quest_id = value;
  }
}

@table("progress")
class Progress extends Table {
  constructor(
    public quest_id: u64 = 0,
    public current_count: u32 = 0,
    public completed: boolean = false,
    public completed_at: u64 = 0,
    public claimed: boolean = false,
  ) {
    super();
  }

  @primary
  get primary(): u64 {
    return this.quest_id;
  }

  set primary(value: u64) {
    this.quest_id = value;
  }
}

@table("config")
class Config extends Table {
  constructor(
    public id: u64 = 0,
    public admin: Name = EMPTY_NAME,
    public next_quest_id: u64 = 1,
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
class XprQuests extends Contract {
  questsTable: TableStore<Quest> = new TableStore<Quest>(this.receiver);
  configTable: TableStore<Config> = new TableStore<Config>(this.receiver);

  // ── helpers ────────────────────────────────
  private getConfig(): Config {
    let cfg = this.configTable.get(0);
    check(cfg != null, "contract not configured – call setadmin first");
    return cfg!;
  }

  private saveConfig(cfg: Config): void {
    this.configTable.set(cfg, this.receiver);
  }

  private getProgressTable(user: Name): TableStore<Progress> {
    return new TableStore<Progress>(user);
  }

  // ── actions ────────────────────────────────

  /**
   * Set the admin account. Requires contract-level authority.
   */
  @action("setadmin")
  setAdmin(admin: Name): void {
    requireAuth(this.receiver);
    check(isAccount(admin), "admin account does not exist");

    let cfg = this.configTable.get(0);
    if (cfg == null) {
      cfg = new Config(0, admin, 1);
    } else {
      cfg!.admin = admin;
    }
    this.configTable.set(cfg!, this.receiver);
  }

  /**
   * Create a new quest. Auto-assigns quest_id from config.next_quest_id.
   * If creator == admin the quest is immediately active (status 1),
   * otherwise it starts as a draft (status 0).
   */
  @action("createquest")
  createQuest(
    creator: Name,
    title: string,
    description: string,
    quest_type: u8,
    target_contract: Name,
    target_action: Name,
    target_params: string,
    required_count: u32,
    xp_reward: u32,
    nft_template_id: i32,
    nft_collection: Name,
    skill_tree: Name,
    prereq_quest_id: u64,
    season_id: u32,
    kyc_required: boolean,
    min_account_age_hrs: u32,
    max_completions: u32,
  ): void {
    requireAuth(creator);

    const cfg = this.getConfig();

    // Validate target_contract if provided
    if (target_contract != EMPTY_NAME) {
      check(isAccount(target_contract), "target_contract account does not exist");
    }

    // prerequisite quest must exist if specified
    if (prereq_quest_id > 0) {
      const prereq = this.questsTable.get(prereq_quest_id);
      check(prereq != null, "prerequisite quest does not exist");
    }

    check(required_count > 0, "required_count must be greater than 0");
    check(xp_reward > 0, "xp_reward must be greater than 0");
    check(title.length > 0, "title cannot be empty");

    const questId = cfg.next_quest_id;
    const status: u8 = creator == cfg.admin ? 1 : 0;

    const quest = new Quest(
      questId,
      creator,
      title,
      description,
      quest_type,
      target_contract,
      target_action,
      target_params,
      required_count,
      xp_reward,
      nft_template_id,
      nft_collection,
      skill_tree,
      prereq_quest_id,
      season_id,
      kyc_required,
      min_account_age_hrs,
      max_completions,
      0, // completed_count
      status,
      currentTimeSec(),
    );

    this.questsTable.store(quest, this.receiver);

    // Increment next_quest_id
    cfg.next_quest_id = questId + 1;
    this.saveConfig(cfg);
  }

  /**
   * Record progress towards a quest for a user.
   * Only callable by the contract itself (backend service).
   */
  @action("recordprog")
  recordProgress(user: Name, quest_id: u64): void {
    requireAuth(this.receiver);
    check(isAccount(user), "user account does not exist");

    const quest = this.questsTable.get(quest_id);
    check(quest != null, "quest does not exist");
    check(quest!.status == 1, "quest is not active");

    // Check max completions (0 = unlimited)
    if (quest!.max_completions > 0) {
      check(
        quest!.completed_count < quest!.max_completions,
        "quest has reached maximum completions",
      );
    }

    const progressTable = this.getProgressTable(user);
    let progress = progressTable.get(quest_id);

    if (progress == null) {
      progress = new Progress(quest_id, 0, false, 0, false);
    }

    check(!progress!.completed, "quest already completed by this user");

    progress!.current_count += 1;

    if (progress!.current_count >= quest!.required_count) {
      progress!.completed = true;
      progress!.completed_at = currentTimeSec();
    }

    progressTable.set(progress!, this.receiver);
  }

  /**
   * Claim XP reward for a completed quest.
   * Sends inline action to xprquestxp::addxp.
   */
  @action("claimreward")
  claimReward(user: Name, quest_id: u64): void {
    requireAuth(user);

    const quest = this.questsTable.get(quest_id);
    check(quest != null, "quest does not exist");

    const progressTable = this.getProgressTable(user);
    const progress = progressTable.get(quest_id);
    check(progress != null, "no progress found for this quest");
    check(progress!.completed, "quest not yet completed");
    check(!progress!.claimed, "reward already claimed");

    // Mark claimed
    progress!.claimed = true;
    progressTable.set(progress!, this.receiver);

    // Increment completed_count on the quest
    quest!.completed_count += 1;
    this.questsTable.set(quest!, this.receiver);

    // Send inline action to xprquestxp::addxp
    const xpContract = Name.fromString("xprquestxp");
    const addxpAction = Name.fromString("addxp");

    const actionData = new AddXPActionData(
      user,
      quest!.xp_reward,
      quest!.skill_tree,
      quest!.season_id,
    );

    const action = new Action(
      xpContract,
      addxpAction,
      [new PermissionLevel(this.receiver, Name.fromString("active"))],
      actionData.pack(),
    );

    action.send();

    // Mint NFT badge if template is configured
    if (quest!.nft_template_id > 0 && quest!.nft_collection != EMPTY_NAME) {
      const atomicAssets = Name.fromString("atomicassets");
      const mintAction = Name.fromString("mintasset");

      const mintData = new MintAssetActionData(
        this.receiver,       // authorized_minter
        quest!.nft_collection,
        Name.fromString("questbadges"),
        quest!.nft_template_id,
        user,                // new_asset_owner
      );

      const mintAct = new Action(
        atomicAssets,
        mintAction,
        [new PermissionLevel(this.receiver, Name.fromString("active"))],
        mintData.pack(),
      );

      mintAct.send();
    }
  }

  /**
   * Approve a quest (set status to active).
   * Only the admin can approve quests.
   */
  @action("approvequest")
  approveQuest(quest_id: u64): void {
    const cfg = this.getConfig();
    requireAuth(cfg.admin);

    const quest = this.questsTable.get(quest_id);
    check(quest != null, "quest does not exist");
    check(quest!.status == 0, "quest is not in draft status");

    quest!.status = 1;
    this.questsTable.set(quest!, this.receiver);
  }

  /**
   * Set quest status to an arbitrary value.
   * Only the admin can change quest status.
   * Status values: 0 = draft, 1 = active, 2 = paused, 3 = ended
   */
  @action("setqstatus")
  setQuestStatus(quest_id: u64, status: u8): void {
    const cfg = this.getConfig();
    requireAuth(cfg.admin);

    const quest = this.questsTable.get(quest_id);
    check(quest != null, "quest does not exist");

    quest!.status = status;
    this.questsTable.set(quest!, this.receiver);
  }
}

// ─────────────────────────────────────────────
//  Inline-action packing helper
// ─────────────────────────────────────────────

@packer
class AddXPActionData {
  constructor(
    public user: Name = EMPTY_NAME,
    public amount: u32 = 0,
    public skill_tree: Name = EMPTY_NAME,
    public season_id: u32 = 0,
  ) {}
}

@packer
class MintAssetActionData {
  constructor(
    public authorized_minter: Name = EMPTY_NAME,
    public collection_name: Name = EMPTY_NAME,
    public schema_name: Name = EMPTY_NAME,
    public template_id: i32 = 0,
    public new_asset_owner: Name = EMPTY_NAME,
  ) {}
}
