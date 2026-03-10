import { Blockchain, expectToThrow, nameToBigInt, symbolCodeToBigInt } from "@proton/vert";
import { expect } from "chai";

/* ─────────────────────────────────────────────
 *  Bootstrap
 * ───────────────────────────────────────────── */
const blockchain = new Blockchain();

const questContract = blockchain.createContract("xprquests", "assembly/xprquests.contract", true);
const xpContract = blockchain.createContract("xprquestxp", "../xprquestxp/assembly/xprquestxp.contract", true);

const [admin, alice, bob] = blockchain.createAccounts("admin", "alice", "bob");

/* ─────────────────────────────────────────────
 *  Helpers
 * ───────────────────────────────────────────── */
async function setAdmin(): Promise<void> {
  await questContract.actions.setadmin(["admin"]).send("xprquests@active");
}

async function createDefaultQuest(creator: string = "admin"): Promise<void> {
  await questContract.actions
    .createquest([
      creator,           // creator
      "Test Quest",      // title
      "A test quest",    // description
      1,                 // quest_type
      "",                // target_contract
      "",                // target_action
      "",                // target_params
      3,                 // required_count
      100,               // xp_reward
      -1,                // nft_template_id
      "",                // nft_collection
      "",                // skill_tree
      0,                 // prereq_quest_id
      1,                 // season_id
      false,             // kyc_required
      48,                // min_account_age_hrs
      0,                 // max_completions (unlimited)
    ])
    .send(`${creator}@active`);
}

/* ─────────────────────────────────────────────
 *  Tests
 * ───────────────────────────────────────────── */
describe("XprQuests Contract", () => {
  before(async () => {
    blockchain.resetTables();
  });

  // ─── setadmin ──────────────────────────────
  describe("setadmin", () => {
    it("should allow contract self to set admin", async () => {
      await setAdmin();

      const config = questContract.tables.config().getTableRows();
      expect(config.length).to.equal(1);
      expect(config[0].admin).to.equal("admin");
      expect(config[0].next_quest_id).to.equal(1);
    });

    it("should reject non-self auth", async () => {
      await expectToThrow(
        questContract.actions.setadmin(["admin"]).send("alice@active"),
        "Missing required authority",
      );
    });
  });

  // ─── createquest ───────────────────────────
  describe("createquest", () => {
    it("admin should create an active quest (status 1)", async () => {
      await createDefaultQuest("admin");

      const quests = questContract.tables.quests().getTableRows();
      expect(quests.length).to.equal(1);
      expect(quests[0].quest_id).to.equal(1);
      expect(quests[0].title).to.equal("Test Quest");
      expect(quests[0].status).to.equal(1); // active
      expect(quests[0].xp_reward).to.equal(100);
    });

    it("non-admin should create a draft quest (status 0)", async () => {
      await createDefaultQuest("alice");

      const quests = questContract.tables.quests().getTableRows();
      const aliceQuest = quests.find((q: any) => q.creator === "alice");
      expect(aliceQuest).to.not.be.undefined;
      expect(aliceQuest!.status).to.equal(0); // draft
    });

    it("should auto-increment quest_id", async () => {
      const quests = questContract.tables.quests().getTableRows();
      const ids = quests.map((q: any) => q.quest_id);
      expect(ids).to.include(1);
      expect(ids).to.include(2);
    });

    it("should reject if creator does not authorize", async () => {
      await expectToThrow(
        questContract.actions
          .createquest([
            "alice", "Hack", "bad", 1, "", "", "", 1, 100, -1, "", "", 0, 0, false, 48, 0,
          ])
          .send("bob@active"),
        "Missing required authority",
      );
    });

    it("should reject empty title", async () => {
      await expectToThrow(
        questContract.actions
          .createquest([
            "admin", "", "desc", 1, "", "", "", 1, 100, -1, "", "", 0, 0, false, 48, 0,
          ])
          .send("admin@active"),
        "title cannot be empty",
      );
    });

    it("should reject zero required_count", async () => {
      await expectToThrow(
        questContract.actions
          .createquest([
            "admin", "Q", "desc", 1, "", "", "", 0, 100, -1, "", "", 0, 0, false, 48, 0,
          ])
          .send("admin@active"),
        "required_count must be greater than 0",
      );
    });

    it("should reject zero xp_reward", async () => {
      await expectToThrow(
        questContract.actions
          .createquest([
            "admin", "Q", "desc", 1, "", "", "", 1, 0, -1, "", "", 0, 0, false, 48, 0,
          ])
          .send("admin@active"),
        "xp_reward must be greater than 0",
      );
    });
  });

  // ─── approvequest ──────────────────────────
  describe("approvequest", () => {
    it("admin can approve a draft quest", async () => {
      // quest_id=2 was created by alice (draft)
      await questContract.actions.approvequest([2]).send("admin@active");

      const quests = questContract.tables.quests().getTableRows();
      const quest = quests.find((q: any) => q.quest_id === 2);
      expect(quest!.status).to.equal(1);
    });

    it("non-admin cannot approve a quest", async () => {
      // Create another draft
      await createDefaultQuest("bob");

      await expectToThrow(
        questContract.actions.approvequest([3]).send("alice@active"),
        "Missing required authority",
      );
    });

    it("cannot approve an already active quest", async () => {
      await expectToThrow(
        questContract.actions.approvequest([1]).send("admin@active"),
        "quest is not in draft status",
      );
    });
  });

  // ─── setqstatus ────────────────────────────
  describe("setqstatus", () => {
    it("admin can change quest status", async () => {
      await questContract.actions.setqstatus([1, 2]).send("admin@active"); // pause
      const quests = questContract.tables.quests().getTableRows();
      const quest = quests.find((q: any) => q.quest_id === 1);
      expect(quest!.status).to.equal(2);

      // Restore to active
      await questContract.actions.setqstatus([1, 1]).send("admin@active");
    });

    it("non-admin cannot change status", async () => {
      await expectToThrow(
        questContract.actions.setqstatus([1, 2]).send("alice@active"),
        "Missing required authority",
      );
    });
  });

  // ─── recordprog ────────────────────────────
  describe("recordprog", () => {
    it("contract self can record progress", async () => {
      await questContract.actions.recordprog(["alice", 1]).send("xprquests@active");

      const progress = questContract.tables.progress(nameToBigInt("alice")).getTableRows();
      expect(progress.length).to.equal(1);
      expect(progress[0].quest_id).to.equal(1);
      expect(progress[0].current_count).to.equal(1);
      expect(progress[0].completed).to.equal(false);
    });

    it("non-self cannot record progress", async () => {
      await expectToThrow(
        questContract.actions.recordprog(["alice", 1]).send("alice@active"),
        "Missing required authority",
      );
    });

    it("marks completed when reaching required_count", async () => {
      // Need 2 more (required_count=3, current=1)
      await questContract.actions.recordprog(["alice", 1]).send("xprquests@active");
      await questContract.actions.recordprog(["alice", 1]).send("xprquests@active");

      const progress = questContract.tables.progress(nameToBigInt("alice")).getTableRows();
      const p = progress.find((r: any) => r.quest_id === 1);
      expect(p!.current_count).to.equal(3);
      expect(p!.completed).to.equal(true);
      expect(p!.completed_at).to.be.greaterThan(0);
    });

    it("rejects progress on already-completed quest", async () => {
      await expectToThrow(
        questContract.actions.recordprog(["alice", 1]).send("xprquests@active"),
        "quest already completed by this user",
      );
    });

    it("rejects progress on inactive quest", async () => {
      // Pause quest 2
      await questContract.actions.setqstatus([2, 2]).send("admin@active");
      await expectToThrow(
        questContract.actions.recordprog(["bob", 2]).send("xprquests@active"),
        "quest is not active",
      );
      // Restore
      await questContract.actions.setqstatus([2, 1]).send("admin@active");
    });
  });

  // ─── claimreward ───────────────────────────
  describe("claimreward", () => {
    it("user can claim reward after completing quest", async () => {
      // alice completed quest 1 above. Now claim.
      await questContract.actions.claimreward(["alice", 1]).send("alice@active");

      const progress = questContract.tables.progress(nameToBigInt("alice")).getTableRows();
      const p = progress.find((r: any) => r.quest_id === 1);
      expect(p!.claimed).to.equal(true);

      // completed_count on the quest should have incremented
      const quests = questContract.tables.quests().getTableRows();
      const quest = quests.find((q: any) => q.quest_id === 1);
      expect(quest!.completed_count).to.equal(1);
    });

    it("double claim is prevented", async () => {
      await expectToThrow(
        questContract.actions.claimreward(["alice", 1]).send("alice@active"),
        "reward already claimed",
      );
    });

    it("cannot claim if quest not completed", async () => {
      // bob has no progress
      await expectToThrow(
        questContract.actions.claimreward(["bob", 1]).send("bob@active"),
        "no progress found for this quest",
      );
    });

    it("another user cannot claim on behalf of user", async () => {
      await expectToThrow(
        questContract.actions.claimreward(["alice", 2]).send("bob@active"),
        "Missing required authority",
      );
    });
  });
});
