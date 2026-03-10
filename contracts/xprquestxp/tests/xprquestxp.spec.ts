import { Blockchain, expectToThrow, nameToBigInt } from "@proton/vert";
import { expect } from "chai";

/* ─────────────────────────────────────────────
 *  Bootstrap
 * ───────────────────────────────────────────── */
const blockchain = new Blockchain();

const xpContract = blockchain.createContract("xprquestxp", "assembly/xprquestxp.contract", true);

// xprquests is the authorized caller for addxp
const questContract = blockchain.createAccount("xprquests");
const [admin, alice, bob] = blockchain.createAccounts("admin", "alice", "bob");

/* ─────────────────────────────────────────────
 *  Helpers
 * ───────────────────────────────────────────── */
async function setupConfig(): Promise<void> {
  await xpContract.actions.setconfig(["admin", "xprquests"]).send("xprquestxp@active");
}

async function addXP(
  user: string,
  amount: number,
  skill_tree: string = "",
  season_id: number = 0,
): Promise<void> {
  await xpContract.actions.addxp([user, amount, skill_tree, season_id]).send("xprquests@active");
}

/* ─────────────────────────────────────────────
 *  Tests
 * ───────────────────────────────────────────── */
describe("XprQuestXP Contract", () => {
  before(async () => {
    blockchain.resetTables();
    await setupConfig();
  });

  // ─── setconfig ─────────────────────────────
  describe("setconfig", () => {
    it("should store config correctly", () => {
      const config = xpContract.tables.xpconfig().getTableRows();
      expect(config.length).to.equal(1);
      expect(config[0].admin).to.equal("admin");
      expect(config[0].quest_contract).to.equal("xprquests");
    });

    it("should reject non-self auth", async () => {
      await expectToThrow(
        xpContract.actions.setconfig(["admin", "xprquests"]).send("alice@active"),
        "Missing required authority",
      );
    });
  });

  // ─── addxp ─────────────────────────────────
  describe("addxp", () => {
    it("should create account and add XP on first call", async () => {
      await addXP("alice", 100);

      const accounts = xpContract.tables.accounts().getTableRows();
      const acct = accounts.find((a: any) => a.user === "alice");
      expect(acct).to.not.be.undefined;
      expect(acct!.lifetime_xp).to.equal(100);
      expect(acct!.spendable_xp).to.equal(100);
    });

    it("should increment XP on subsequent calls", async () => {
      await addXP("alice", 200);

      const accounts = xpContract.tables.accounts().getTableRows();
      const acct = accounts.find((a: any) => a.user === "alice");
      expect(acct!.lifetime_xp).to.equal(300);
      expect(acct!.spendable_xp).to.equal(300);
    });

    it("should reject calls from unauthorized account", async () => {
      await expectToThrow(
        xpContract.actions.addxp(["alice", 100, "", 0]).send("alice@active"),
        "Missing required authority",
      );
    });

    it("should reject zero amount", async () => {
      await expectToThrow(
        xpContract.actions.addxp(["alice", 0, "", 0]).send("xprquests@active"),
        "amount must be greater than 0",
      );
    });
  });

  // ─── multiplier ────────────────────────────
  describe("multiplier application", () => {
    it("1.5x multiplier should boost XP correctly", async () => {
      // Set alice multiplier to 150 (1.5x)
      await xpContract.actions.setmultiplr(["alice", 150, true]).send("admin@active");

      // Current XP: 300. Add 100 base -> 150 boosted -> total 450
      await addXP("alice", 100);

      const accounts = xpContract.tables.accounts().getTableRows();
      const acct = accounts.find((a: any) => a.user === "alice");
      expect(acct!.lifetime_xp).to.equal(450);
      expect(acct!.spendable_xp).to.equal(450);
      expect(acct!.kyc_verified).to.equal(true);
    });

    it("2x multiplier should double XP", async () => {
      await xpContract.actions.setmultiplr(["alice", 200, true]).send("admin@active");

      // Add 100 base -> 200 boosted -> total 650
      await addXP("alice", 100);

      const accounts = xpContract.tables.accounts().getTableRows();
      const acct = accounts.find((a: any) => a.user === "alice");
      expect(acct!.lifetime_xp).to.equal(650);
    });
  });

  // ─── level calculation ─────────────────────
  describe("level calculation", () => {
    it("level = floor(sqrt(lifetime_xp / 100))", async () => {
      // Reset: create bob with known XP
      // 10000 xp -> level = floor(sqrt(100)) = 10
      for (let i = 0; i < 100; i++) {
        await addXP("bob", 100);
      }

      const accounts = xpContract.tables.accounts().getTableRows();
      const acct = accounts.find((a: any) => a.user === "bob");
      expect(acct!.lifetime_xp).to.equal(10000);
      expect(acct!.level).to.equal(10); // sqrt(10000/100) = sqrt(100) = 10
    });
  });

  // ─── tier promotion ────────────────────────
  describe("tier promotion", () => {
    it("should assign correct tier based on level", async () => {
      // bob has level 10 -> tier should be 2 (Uncommon: 5-14)
      const accounts = xpContract.tables.accounts().getTableRows();
      const acct = accounts.find((a: any) => a.user === "bob");
      expect(acct!.tier).to.equal(2); // Uncommon
    });
  });

  // ─── skill tree XP ────────────────────────
  describe("skill tree XP", () => {
    it("should track XP per skill tree", async () => {
      await addXP("alice", 100, "defi", 0);

      const skillRows = xpContract.tables.skillxp(nameToBigInt("alice")).getTableRows();
      const defiSkill = skillRows.find((s: any) => s.skill_tree === "defi");
      expect(defiSkill).to.not.be.undefined;
      expect(defiSkill!.xp).to.be.greaterThan(0);
      expect(defiSkill!.quests_completed).to.equal(1);
    });

    it("should increment quests_completed for same skill tree", async () => {
      await addXP("alice", 50, "defi", 0);

      const skillRows = xpContract.tables.skillxp(nameToBigInt("alice")).getTableRows();
      const defiSkill = skillRows.find((s: any) => s.skill_tree === "defi");
      expect(defiSkill!.quests_completed).to.equal(2);
    });
  });

  // ─── season XP ─────────────────────────────
  describe("season XP", () => {
    it("should track XP per season", async () => {
      await addXP("alice", 100, "", 1);

      const seasonRows = xpContract.tables.seasonxp(BigInt(1)).getTableRows();
      const entry = seasonRows.find((s: any) => s.user === "alice");
      expect(entry).to.not.be.undefined;
      expect(entry!.xp).to.be.greaterThan(0);
    });
  });

  // ─── spendxp ───────────────────────────────
  describe("spendxp", () => {
    it("user can spend spendable XP", async () => {
      const accountsBefore = xpContract.tables.accounts().getTableRows();
      const before = accountsBefore.find((a: any) => a.user === "alice");
      const spendableBefore = before!.spendable_xp;

      await xpContract.actions.spendxp(["alice", 50]).send("alice@active");

      const accountsAfter = xpContract.tables.accounts().getTableRows();
      const after = accountsAfter.find((a: any) => a.user === "alice");
      expect(after!.spendable_xp).to.equal(spendableBefore - 50);
      // lifetime_xp should remain unchanged
      expect(after!.lifetime_xp).to.equal(before!.lifetime_xp);
    });

    it("should reject spending more than available", async () => {
      const accounts = xpContract.tables.accounts().getTableRows();
      const acct = accounts.find((a: any) => a.user === "alice");
      const tooMuch = acct!.spendable_xp + 1;

      await expectToThrow(
        xpContract.actions.spendxp(["alice", tooMuch]).send("alice@active"),
        "insufficient spendable XP",
      );
    });

    it("should reject spending zero", async () => {
      await expectToThrow(
        xpContract.actions.spendxp(["alice", 0]).send("alice@active"),
        "amount must be greater than 0",
      );
    });

    it("another user cannot spend someone else's XP", async () => {
      await expectToThrow(
        xpContract.actions.spendxp(["alice", 10]).send("bob@active"),
        "Missing required authority",
      );
    });
  });

  // ─── setmultiplr auth ──────────────────────
  describe("setmultiplr", () => {
    it("only admin can set multiplier", async () => {
      await expectToThrow(
        xpContract.actions.setmultiplr(["alice", 200, true]).send("alice@active"),
        "Missing required authority",
      );
    });

    it("should reject zero multiplier", async () => {
      await expectToThrow(
        xpContract.actions.setmultiplr(["alice", 0, false]).send("admin@active"),
        "multiplier must be greater than 0",
      );
    });
  });

  // ─── soulbound: no transfer ────────────────
  describe("soulbound (no transfer)", () => {
    it("contract should NOT have a transfer action", () => {
      // Verify there is no 'transfer' action on the ABI
      const abi = xpContract.abi;
      const hasTransfer = abi.actions?.some(
        (a: any) => a.name === "transfer",
      );
      expect(hasTransfer).to.not.equal(true);
    });
  });
});
