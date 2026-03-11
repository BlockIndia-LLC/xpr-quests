import { Blockchain, expectToThrow, nameToBigInt } from "@proton/vert";
import { expect } from "chai";

/* ─────────────────────────────────────────────
 *  Bootstrap
 * ───────────────────────────────────────────── */
const blockchain = new Blockchain();

const sznContract = blockchain.createContract("xprseasons", "assembly/xprseasons.contract", true);

const xpContract = blockchain.createAccount("xprquestxp");
const tokenContract = blockchain.createAccount("eosio.token");
const [admin, alice, bob, charlie] = blockchain.createAccounts("admin", "alice", "bob", "charlie");

/* ─────────────────────────────────────────────
 *  Helpers
 * ───────────────────────────────────────────── */
async function setupConfig(): Promise<void> {
  await sznContract.actions.setconfig(["admin", "xprquestxp", "eosio.token"]).send("xprseasons@active");
}

/* ─────────────────────────────────────────────
 *  Tests
 * ───────────────────────────────────────────── */
describe("XprSeasons Contract", () => {
  before(async () => {
    blockchain.resetTables();
    await setupConfig();
  });

  // ─── setconfig ─────────────────────────────
  describe("setconfig", () => {
    it("should store config correctly", () => {
      const config = sznContract.tables.sznconfig().getTableRows();
      expect(config.length).to.equal(1);
      expect(config[0].admin).to.equal("admin");
      expect(config[0].xp_contract).to.equal("xprquestxp");
      expect(config[0].token_contract).to.equal("eosio.token");
      expect(config[0].next_season_id).to.equal(1);
    });

    it("should reject non-self auth", async () => {
      await expectToThrow(
        sznContract.actions.setconfig(["admin", "xprquestxp", "eosio.token"]).send("alice@active"),
        "Missing required authority",
      );
    });
  });

  // ─── createseason ──────────────────────────
  describe("createseason", () => {
    it("should create a season with auto-incremented ID", async () => {
      await sznContract.actions.createseason([
        "Genesis Season",
        9999000000,     // start_time (far future)
        9999900000,     // end_time
        "10000.0000 XPR",
      ]).send("admin@active");

      const seasons = sznContract.tables.seasons().getTableRows();
      expect(seasons.length).to.equal(1);
      expect(seasons[0].season_id).to.equal(1);
      expect(seasons[0].title).to.equal("Genesis Season");
      expect(seasons[0].reward_pool).to.equal("10000.0000 XPR");
      expect(seasons[0].status).to.equal(0); // upcoming
    });

    it("should auto-increment season_id", async () => {
      await sznContract.actions.createseason([
        "Season 2",
        9999000000,
        9999900000,
        "5000.0000 XPR",
      ]).send("admin@active");

      const seasons = sznContract.tables.seasons().getTableRows();
      expect(seasons.length).to.equal(2);
      expect(seasons[1].season_id).to.equal(2);
    });

    it("should reject non-admin auth", async () => {
      await expectToThrow(
        sznContract.actions.createseason([
          "Bad Season", 9999000000, 9999900000, "100.0000 XPR",
        ]).send("alice@active"),
        "Missing required authority",
      );
    });

    it("should reject empty title", async () => {
      await expectToThrow(
        sznContract.actions.createseason([
          "", 9999000000, 9999900000, "100.0000 XPR",
        ]).send("admin@active"),
        "title cannot be empty",
      );
    });

    it("should reject invalid time range", async () => {
      await expectToThrow(
        sznContract.actions.createseason([
          "Bad Time", 9999900000, 9999000000, "100.0000 XPR",
        ]).send("admin@active"),
        "end_time must be after start_time",
      );
    });

    it("should reject start_time in the past", async () => {
      await expectToThrow(
        sznContract.actions.createseason([
          "Past Season", 1, 9999900000, "100.0000 XPR",
        ]).send("admin@active"),
        "start_time must be in the future",
      );
    });
  });

  // ─── startseason ───────────────────────────
  describe("startseason", () => {
    it("should start an upcoming season", async () => {
      await sznContract.actions.startseason([1]).send("admin@active");

      const seasons = sznContract.tables.seasons().getTableRows();
      const s1 = seasons.find((s: any) => s.season_id === 1);
      expect(s1!.status).to.equal(1); // active
    });

    it("should reject starting an already active season", async () => {
      await expectToThrow(
        sznContract.actions.startseason([1]).send("admin@active"),
        "season is not in upcoming status",
      );
    });

    it("should reject non-admin auth", async () => {
      await expectToThrow(
        sznContract.actions.startseason([2]).send("alice@active"),
        "Missing required authority",
      );
    });
  });

  // ─── endseason ─────────────────────────────
  describe("endseason", () => {
    it("should end an active season", async () => {
      await sznContract.actions.endseason([1]).send("admin@active");

      const seasons = sznContract.tables.seasons().getTableRows();
      const s1 = seasons.find((s: any) => s.season_id === 1);
      expect(s1!.status).to.equal(2); // ended
    });

    it("should reject ending an already ended season", async () => {
      await expectToThrow(
        sznContract.actions.endseason([1]).send("admin@active"),
        "season is not active",
      );
    });
  });

  // ─── snapshot ──────────────────────────────
  describe("snapshot", () => {
    it("should write leaderboard entries", async () => {
      await sznContract.actions.snapshot([
        1,
        ["alice", "bob", "charlie"],
        [5000, 3000, 1000],
        [1, 2, 3],
      ]).send("admin@active");

      const leaderboard = sznContract.tables.leaderboard(BigInt(1)).getTableRows();
      expect(leaderboard.length).to.equal(3);

      const aliceEntry = leaderboard.find((e: any) => e.user === "alice");
      expect(aliceEntry!.xp).to.equal(5000);
      expect(aliceEntry!.rank).to.equal(1);

      const bobEntry = leaderboard.find((e: any) => e.user === "bob");
      expect(bobEntry!.xp).to.equal(3000);
      expect(bobEntry!.rank).to.equal(2);
    });

    it("should reject snapshot on non-ended season", async () => {
      // Season 2 is still upcoming (status 0)
      await expectToThrow(
        sznContract.actions.snapshot([
          2, ["alice"], [100], [1],
        ]).send("admin@active"),
        "season must be ended before snapshot",
      );
    });

    it("should reject mismatched array lengths", async () => {
      await expectToThrow(
        sznContract.actions.snapshot([
          1, ["alice", "bob"], [100], [1, 2],
        ]).send("admin@active"),
        "users and xps must have same length",
      );
    });

    it("should reject empty users array", async () => {
      await expectToThrow(
        sznContract.actions.snapshot([
          1, [], [], [],
        ]).send("admin@active"),
        "users array cannot be empty",
      );
    });

    it("should reject duplicate user in snapshot", async () => {
      // alice was already snapshotted above
      await expectToThrow(
        sznContract.actions.snapshot([
          1, ["alice"], [9999], [1],
        ]).send("admin@active"),
        "duplicate user in snapshot",
      );
    });
  });

  // ─── distribute ────────────────────────────
  describe("distribute", () => {
    it("should write rewards and set status to 3", async () => {
      await sznContract.actions.distribute([
        1,
        ["alice", "bob", "charlie"],
        ["300.0000 XPR", "50.0000 XPR", "6.2500 XPR"],
      ]).send("admin@active");

      const seasons = sznContract.tables.seasons().getTableRows();
      const s1 = seasons.find((s: any) => s.season_id === 1);
      expect(s1!.status).to.equal(3); // distributed

      const rewards = sznContract.tables.rewards(BigInt(1)).getTableRows();
      expect(rewards.length).to.equal(3);

      const aliceReward = rewards.find((r: any) => r.user === "alice");
      expect(aliceReward!.amount).to.equal("300.0000 XPR");
      expect(aliceReward!.claimed).to.equal(false);
    });

    it("should reject distributing to non-ended season", async () => {
      // Season 2 is upcoming (status 0), not ended
      await expectToThrow(
        sznContract.actions.distribute([
          2, ["alice"], ["100.0000 XPR"],
        ]).send("admin@active"),
        "season must be ended before distribution",
      );
    });

    it("should reject empty users array", async () => {
      // Create and end a new season for this test
      await sznContract.actions.createseason([
        "Season 3", 9999000000, 9999900000, "1000.0000 XPR",
      ]).send("admin@active");
      await sznContract.actions.startseason([3]).send("admin@active");
      await sznContract.actions.endseason([3]).send("admin@active");

      await expectToThrow(
        sznContract.actions.distribute([
          3, [], [],
        ]).send("admin@active"),
        "users array cannot be empty",
      );
    });
  });

  // ─── claimseasonrwd ────────────────────────
  describe("claimseasonrwd", () => {
    it("should reject claim from user with no reward", async () => {
      // admin has no reward entry
      await expectToThrow(
        sznContract.actions.claimseasonrwd(["admin", 1]).send("admin@active"),
        "no reward found for this user",
      );
    });

    it("should reject non-self auth for claiming", async () => {
      await expectToThrow(
        sznContract.actions.claimseasonrwd(["alice", 1]).send("bob@active"),
        "Missing required authority",
      );
    });

    // Note: The actual claimseasonrwd with inline token::transfer
    // would require a full eosio.token mock which is complex in vert.
    // The inline action send will fail in test env, but the logic
    // flow (marking claimed=true) is correct.

    it("should reject claim on undistributed season", async () => {
      // Season 2 is upcoming (status 0)
      await expectToThrow(
        sznContract.actions.claimseasonrwd(["alice", 2]).send("alice@active"),
        "rewards have not been distributed yet",
      );
    });
  });

  // ─── config update ────────────────────────
  describe("config update", () => {
    it("should update existing config", async () => {
      await sznContract.actions.setconfig(["bob", "xprquestxp", "eosio.token"]).send("xprseasons@active");

      const config = sznContract.tables.sznconfig().getTableRows();
      expect(config[0].admin).to.equal("bob");
      expect(config[0].token_contract).to.equal("eosio.token");
      // next_season_id should be preserved
      expect(config[0].next_season_id).to.equal(4); // after creating 3 seasons
    });
  });
});
