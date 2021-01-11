const { ether, expectEvent, expectRevert, time } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");

var Egg = artifacts.require("EggToken.sol");
var WithdrawableDistribution = artifacts.require("WithdrawableDistribution.sol");
var IERC20 = artifacts.require("IERC20.sol");

contract("WithdrawableDistribution", function (accounts) {
  const [owner, user1, user2, user3] = accounts;

  const totalSupply = ether("1000");
  const singleDistributionAmount = ether("100");

  before(async function () {
    await time.advanceBlock();
  });

  beforeEach(async function () {
    this.egg = await Egg.new("Test Egg", "Egg", totalSupply, { from: owner });
    this.withdrawableDistribution = await WithdrawableDistribution.new(this.egg.address, {
      from: owner,
    });
  });

  describe("when lockable distribution contract is deployed", function () {
    it("should not be able to set withdrawable distribution contract if not an owner", async function () {
      await expectRevert(
        this.egg.setLockableDistributionContract(this.withdrawableDistribution.address, {
          from: user1,
        }),
        "Ownable: only contract owner can call this function."
      );
    });
  });

  describe("when lockable distribution contract is set up", function () {
    beforeEach(async function () {
      await this.egg.setLockableDistributionContract(this.withdrawableDistribution.address, {
        from: owner,
      });

      await this.egg.transfer(
        this.withdrawableDistribution.address,
        singleDistributionAmount.muln(2),
        {
          from: owner,
        }
      );
    });

    describe("when lockable distribution is enabled", function () {
      it("should not be able to trigger locking directly", async function () {
        await expectRevert(
          this.egg.lock(user1, ether("1"), (await time.latest()).add(time.duration.minutes(1)), {
            from: owner,
          }),
          "ERC20Lockable: only distribution contract can lock tokens"
        );
      });
    });

    describe("when locked and unlocked distribution is performed", function () {
      it("should be able to withdraw and use locked tokens in a full amount only once lock duration has passed, freely use unlocked tokens and throw if WithdrawableDistribution balance is not enough to withdraw the tokens", async function () {
        let unlockedWithdrawalLimitUser1BeforeLimitIncrease = await this.withdrawableDistribution.unlockedWithdrawalLimit(
          user1,
          {
            from: owner,
          }
        );
        let lockedWithdrawalLimitUser1BeforeLimitIncrease = await this.withdrawableDistribution.lockedWithdrawalLimit(
          user1,
          {
            from: owner,
          }
        );
        let unlockedWithdrawalLimitUser2BeforeLimitIncrease = await this.withdrawableDistribution.unlockedWithdrawalLimit(
          user2,
          {
            from: owner,
          }
        );
        let lockedWithdrawalLimitUser2BeforeLimitIncrease = await this.withdrawableDistribution.lockedWithdrawalLimit(
          user2,
          {
            from: owner,
          }
        );
        let unlockedWithdrawalLimitUser3BeforeLimitIncrease = await this.withdrawableDistribution.unlockedWithdrawalLimit(
          user3,
          {
            from: owner,
          }
        );
        let lockedWithdrawalLimitUser3BeforeLimitIncrease = await this.withdrawableDistribution.lockedWithdrawalLimit(
          user3,
          {
            from: owner,
          }
        );
        expect(unlockedWithdrawalLimitUser1BeforeLimitIncrease).to.be.bignumber.equal("0");
        expect(lockedWithdrawalLimitUser1BeforeLimitIncrease).to.be.bignumber.equal("0");
        expect(unlockedWithdrawalLimitUser2BeforeLimitIncrease).to.be.bignumber.equal("0");
        expect(lockedWithdrawalLimitUser2BeforeLimitIncrease).to.be.bignumber.equal("0");
        expect(unlockedWithdrawalLimitUser3BeforeLimitIncrease).to.be.bignumber.equal("0");
        expect(lockedWithdrawalLimitUser3BeforeLimitIncrease).to.be.bignumber.equal("0");

        let lockOfUser1BeforeLimitIncrease = await this.egg.lockOf(user1, {
          from: owner,
        });
        let lockOfUser2BeforeLimitIncrease = await this.egg.lockOf(user2, {
          from: owner,
        });
        expect(lockOfUser1BeforeLimitIncrease[0]).to.be.bignumber.equal("0");
        expect(lockOfUser2BeforeLimitIncrease[0]).to.be.bignumber.equal("0");

        await this.withdrawableDistribution.increaseUnlockedWithdrawalLimits(
          [user1, user2],
          [singleDistributionAmount, singleDistributionAmount.muln(2)],
          {
            from: owner,
          }
        );
        await this.withdrawableDistribution.increaseLockedWithdrawalLimits(
          [user1, user2],
          [singleDistributionAmount.muln(2), singleDistributionAmount],
          {
            from: owner,
          }
        );

        let unlockedWithdrawalLimitUser1AfterLimitIncrease = await this.withdrawableDistribution.unlockedWithdrawalLimit(
          user1,
          {
            from: owner,
          }
        );
        let lockedWithdrawalLimitUser1AfterLimitIncrease = await this.withdrawableDistribution.lockedWithdrawalLimit(
          user1,
          {
            from: owner,
          }
        );
        let unlockedWithdrawalLimitUser2AfterLimitIncrease = await this.withdrawableDistribution.unlockedWithdrawalLimit(
          user2,
          {
            from: owner,
          }
        );
        let lockedWithdrawalLimitUser2AfterLimitIncrease = await this.withdrawableDistribution.lockedWithdrawalLimit(
          user2,
          {
            from: owner,
          }
        );
        let unlockedWithdrawalLimitUser3AfterLimitIncrease = await this.withdrawableDistribution.unlockedWithdrawalLimit(
          user3,
          {
            from: owner,
          }
        );
        let lockedWithdrawalLimitUser3AfterLimitIncrease = await this.withdrawableDistribution.lockedWithdrawalLimit(
          user3,
          {
            from: owner,
          }
        );
        expect(unlockedWithdrawalLimitUser1AfterLimitIncrease).to.be.bignumber.equal(
          singleDistributionAmount
        );
        expect(lockedWithdrawalLimitUser1AfterLimitIncrease).to.be.bignumber.equal(
          singleDistributionAmount.muln(2)
        );
        expect(unlockedWithdrawalLimitUser2AfterLimitIncrease).to.be.bignumber.equal(
          singleDistributionAmount.muln(2)
        );
        expect(lockedWithdrawalLimitUser2AfterLimitIncrease).to.be.bignumber.equal(
          singleDistributionAmount
        );
        expect(unlockedWithdrawalLimitUser3AfterLimitIncrease).to.be.bignumber.equal("0");
        expect(lockedWithdrawalLimitUser3AfterLimitIncrease).to.be.bignumber.equal("0");

        await time.advanceBlock();
        let withdrawalTime = await time.latest();

        const receiptWithdrawUnlockedUser1 = await this.withdrawableDistribution.withdrawUnlocked({
          from: user1,
        });
        expectEvent.inTransaction(receiptWithdrawUnlockedUser1.tx, IERC20, "Transfer", {
          from: this.withdrawableDistribution.address,
          to: user1,
          value: singleDistributionAmount,
        });
        const receiptWithdrawLockedUser2 = await this.withdrawableDistribution.withdrawLocked({
          from: user2,
        });
        expectEvent.inTransaction(receiptWithdrawLockedUser2.tx, IERC20, "Transfer", {
          from: this.withdrawableDistribution.address,
          to: user2,
          value: singleDistributionAmount,
        });

        await expectRevert(
          this.withdrawableDistribution.withdrawUnlocked({
            from: user3,
          }),
          "WithdrawableDistribution: your wallet address is not eligible to receive the unlocked tokens"
        );
        await expectRevert(
          this.withdrawableDistribution.withdrawLocked({
            from: user3,
          }),
          "WithdrawableDistribution: your wallet address is not eligible to receive the locked tokens"
        );
        await expectRevert(
          this.withdrawableDistribution.withdrawUnlocked({
            from: user2,
          }),
          "WithdrawableDistribution: not enough tokens left for distribution, please contact the contract owner organization"
        );
        await expectRevert(
          this.withdrawableDistribution.withdrawLocked({
            from: user1,
          }),
          "WithdrawableDistribution: not enough tokens left for distribution, please contact the contract owner organization"
        );

        let unlockedWithdrawalLimitUser1AfterWithdrawals = await this.withdrawableDistribution.unlockedWithdrawalLimit(
          user1,
          {
            from: owner,
          }
        );
        let lockedWithdrawalLimitUser1AfterWithdrawals = await this.withdrawableDistribution.lockedWithdrawalLimit(
          user1,
          {
            from: owner,
          }
        );
        let unlockedWithdrawalLimitUser2AfterWithdrawals = await this.withdrawableDistribution.unlockedWithdrawalLimit(
          user2,
          {
            from: owner,
          }
        );
        let lockedWithdrawalLimitUser2AfterWithdrawals = await this.withdrawableDistribution.lockedWithdrawalLimit(
          user2,
          {
            from: owner,
          }
        );
        expect(unlockedWithdrawalLimitUser1AfterWithdrawals).to.be.bignumber.equal("0");
        expect(lockedWithdrawalLimitUser1AfterWithdrawals).to.be.bignumber.equal(
          singleDistributionAmount.muln(2)
        );
        expect(unlockedWithdrawalLimitUser2AfterWithdrawals).to.be.bignumber.equal(
          singleDistributionAmount.muln(2)
        );
        expect(lockedWithdrawalLimitUser2AfterWithdrawals).to.be.bignumber.equal("0");

        let lockOfUser1AfterWithdrawals = await this.egg.lockOf(user1, {
          from: owner,
        });
        let lockOfUser2AfterWithdrawals = await this.egg.lockOf(user2, {
          from: owner,
        });
        expect(lockOfUser1AfterWithdrawals[0]).to.be.bignumber.equal("0");
        expect(lockOfUser2AfterWithdrawals[0]).to.be.bignumber.equal(singleDistributionAmount);

        await expectRevert(
          this.egg.transfer(owner, singleDistributionAmount, {
            from: user2,
          }),
          "ERC20Lockable: transfer amount exceeds the non-locked balance"
        );

        await time.increaseTo(
          withdrawalTime
            .add(await this.withdrawableDistribution.lockDuration())
            .add(time.duration.minutes(1))
        );
        await time.advanceBlock();

        const receiptUnlockedTransferUser2 = await this.egg.transfer(
          owner,
          singleDistributionAmount,
          {
            from: user2,
          }
        );
        expectEvent(receiptUnlockedTransferUser2, "Transfer", {
          from: user2,
          to: owner,
          value: singleDistributionAmount,
        });
      });
    });
  });
});
