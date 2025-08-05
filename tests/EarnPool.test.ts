
import { describe, expect, it, beforeEach } from "vitest";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const deployer = accounts.get("deployer")!;

describe("PredictEarnMicroDAO Tests", () => {
  beforeEach(() => {
    simnet.mineEmptyBlocks(1);
  });

  describe("Prediction Creation", () => {
    it("should create a prediction successfully", () => {
      const { result } = simnet.callPublicFn(
        "EarnPool",
        "create-prediction",
        ["\"Will Bitcoin reach $100k by end of 2024?\"", `u${simnet.blockHeight + 100}`],
        address1
      );
      expect(result).toBeOk();
      expect(result).toBeUint(0);
    });

    it("should reject prediction with empty question", () => {
      const { result } = simnet.callPublicFn(
        "EarnPool",
        "create-prediction",
        ["\"\"", `u${simnet.blockHeight + 100}`],
        address1
      );
      expect(result).toBeErr();
      expect(result).toBeUint(104); // ERR-QUESTION-TOO-SHORT
    });

    it("should reject prediction with end block in the past", () => {
      const { result } = simnet.callPublicFn(
        "EarnPool",
        "create-prediction",
        ["\"Test question?\"", `u${simnet.blockHeight - 1}`],
        address1
      );
      expect(result).toBeErr();
      expect(result).toBeUint(103); // ERR-INVALID-END-BLOCK
    });

    it("should increment prediction counter", () => {
      // Create first prediction
      simnet.callPublicFn(
        "EarnPool",
        "create-prediction",
        ["\"First question?\"", `u${simnet.blockHeight + 100}`],
        address1
      );

      // Create second prediction
      const { result } = simnet.callPublicFn(
        "EarnPool",
        "create-prediction",
        ["\"Second question?\"", `u${simnet.blockHeight + 100}`],
        address1
      );
      
      expect(result).toBeOk();
      expect(result).toBeUint(1);
    });
  });

  describe("Voting", () => {
    beforeEach(() => {
      // Create a prediction for voting tests
      simnet.callPublicFn(
        "EarnPool",
        "create-prediction",
        ["\"Test prediction for voting?\"", `u${simnet.blockHeight + 100}`],
        address1
      );
    });

    it("should allow voting on active prediction", () => {
      const { result } = simnet.callPublicFn(
        "EarnPool",
        "vote",
        ["u0", "true"],
        address2
      );
      expect(result).toBeOk();
      expect(result).toBeAscii("Vote cast");
    });

    it("should reject voting on non-existent prediction", () => {
      const { result } = simnet.callPublicFn(
        "EarnPool",
        "vote",
        ["u999", "true"],
        address2
      );
      expect(result).toBeErr();
      expect(result).toBeUint(101); // ERR-NOT-FOUND
    });

    it("should reject voting on ended prediction", () => {
      // Create prediction that ends soon
      simnet.callPublicFn(
        "EarnPool",
        "create-prediction",
        ["\"Short prediction?\"", `u${simnet.blockHeight + 1}`],
        address1
      );

      // Mine blocks to make prediction end
      simnet.mineEmptyBlocks(5);

      const { result } = simnet.callPublicFn(
        "EarnPool",
        "vote",
        ["u1", "true"],
        address2
      );
      expect(result).toBeErr();
      expect(result).toBeUint(102); // ERR-PREDICTION-ENDED
    });
  });

  describe("View Functions", () => {
    beforeEach(() => {
      // Setup test data
      simnet.callPublicFn(
        "EarnPool",
        "create-prediction",
        ["\"View test prediction?\"", `u${simnet.blockHeight + 100}`],
        address1
      );
      simnet.callPublicFn(
        "EarnPool",
        "vote",
        ["u0", "true"],
        address2
      );
    });

    it("should get prediction details", () => {
      const { result } = simnet.callReadOnlyFn(
        "EarnPool",
        "get-prediction",
        ["u0"],
        address1
      );
      expect(result).toBeSome();
    });

    it("should get vote details", () => {
      const { result } = simnet.callReadOnlyFn(
        "EarnPool",
        "get-vote",
        ["u0", `'${address2}`],
        address1
      );
      expect(result).toBeSome();
      expect(result).toBeBool(true);
    });

    it("should get prediction count", () => {
      const { result } = simnet.callReadOnlyFn(
        "EarnPool",
        "get-prediction-count",
        [],
        address1
      );
      expect(result).toBeUint(1);
    });

    it("should check if user has voted", () => {
      const { result } = simnet.callReadOnlyFn(
        "EarnPool",
        "has-user-voted",
        [`'${address2}`, "u0"],
        address1
      );
      expect(result).toBeBool(true);
    });
  });

  describe("Prediction Status Check", () => {
    it("should identify active prediction", () => {
      simnet.callPublicFn(
        "EarnPool",
        "create-prediction",
        ["\"Active prediction?\"", `u${simnet.blockHeight + 100}`],
        address1
      );

      const { result } = simnet.callReadOnlyFn(
        "EarnPool",
        "is-prediction-active",
        ["u0"],
        address1
      );
      expect(result).toBeBool(true);
    });

    it("should identify ended prediction", () => {
      simnet.callPublicFn(
        "EarnPool",
        "create-prediction",
        ["\"Short prediction?\"", `u${simnet.blockHeight + 1}`],
        address1
      );

      // Mine blocks to end prediction
      simnet.mineEmptyBlocks(5);

      const { result } = simnet.callReadOnlyFn(
        "EarnPool",
        "is-prediction-active",
        ["u0"],
        address1
      );
      expect(result).toBeBool(false);
    });

    it("should get prediction status string", () => {
      simnet.callPublicFn(
        "EarnPool",
        "create-prediction",
        ["\"Status test?\"", `u${simnet.blockHeight + 100}`],
        address1
      );

      const { result } = simnet.callReadOnlyFn(
        "EarnPool",
        "get-prediction-status",
        ["u0"],
        address1
      );
      expect(result).toBeAscii("active");
    });
  });

  describe("Reputation System", () => {
    beforeEach(() => {
      // Create predictions and votes for reputation testing
      simnet.callPublicFn(
        "EarnPool",
        "create-prediction",
        ["\"Reputation test 1?\"", `u${simnet.blockHeight + 100}`],
        address1
      );
      simnet.callPublicFn(
        "EarnPool",
        "create-prediction",
        ["\"Reputation test 2?\"", `u${simnet.blockHeight + 100}`],
        address1
      );
      simnet.callPublicFn(
        "EarnPool",
        "vote",
        ["u0", "true"],
        address2
      );
      simnet.callPublicFn(
        "EarnPool",
        "vote",
        ["u1", "false"],
        address2
      );
    });

    it("should track user stats correctly", () => {
      const { result } = simnet.callReadOnlyFn(
        "EarnPool",
        "get-user-stats",
        [`'${address1}`],
        address1
      );
      expect(result).toBeTuple({
        "predictions-created": "u2",
        "votes-cast": "u0",
        "correct-predictions": "u0"
      });
    });

    it("should calculate participation score", () => {
      const { result } = simnet.callReadOnlyFn(
        "EarnPool",
        "get-user-participation-score",
        [`'${address2}`],
        address1
      );
      expect(result).toBeUint(2); // 0 predictions + 2 votes
    });

    it("should update correct predictions", () => {
      // Update correct prediction for address2
      simnet.callPublicFn(
        "EarnPool",
        "update-correct-prediction",
        [`'${address2}`],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        "EarnPool",
        "get-user-accuracy-rate",
        [`'${address2}`],
        address1
      );
      expect(result).toBeUint(50); // 1 correct out of 2 votes = 50%
    });

    it("should handle zero votes for accuracy rate", () => {
      const { result } = simnet.callReadOnlyFn(
        "EarnPool",
        "get-user-accuracy-rate",
        [`'${deployer}`],
        address1
      );
      expect(result).toBeUint(0);
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete prediction lifecycle", () => {
      // Create prediction
      const createResult = simnet.callPublicFn(
        "EarnPool",
        "create-prediction",
        ["\"Integration test prediction?\"", `u${simnet.blockHeight + 10}`],
        address1
      );
      expect(createResult.result).toBeOk();

      // Vote on prediction
      const voteResult = simnet.callPublicFn(
        "EarnPool",
        "vote",
        ["u0", "true"],
        address2
      );
      expect(voteResult.result).toBeOk();

      // Check prediction is active
      const activeResult = simnet.callReadOnlyFn(
        "EarnPool",
        "is-prediction-active",
        ["u0"],
        address1
      );
      expect(activeResult.result).toBeBool(true);

      // Mine blocks to end prediction
      simnet.mineEmptyBlocks(15);

      // Check prediction is now ended
      const endedResult = simnet.callReadOnlyFn(
        "EarnPool",
        "is-prediction-active",
        ["u0"],
        address1
      );
      expect(endedResult.result).toBeBool(false);

      // Verify user stats
      const statsResult = simnet.callReadOnlyFn(
        "EarnPool",
        "get-user-stats",
        [`'${address2}`],
        address1
      );
      expect(statsResult.result).toBeTuple({
        "predictions-created": "u0",
        "votes-cast": "u1",
        "correct-predictions": "u0"
      });
    });
  });
});
