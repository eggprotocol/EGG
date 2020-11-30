const { ether, expectEvent, expectRevert, time } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");

var Egg = artifacts.require("EggToken.sol");
var LockableDistribution = artifacts.require("LockableDistribution.sol");
var IERC20 = artifacts.require("IERC20.sol");

contract("LockableDistribution", function (accounts) {
  const [owner, user1, user2] = accounts;

  const totalSupply = ether("1000");
  const singleDistributionAmount = ether("100");

  before(async function () {
    await time.advanceBlock();
  });

  beforeEach(async function () {
    this.egg = await Egg.new("Test Egg", "Egg", totalSupply, { from: owner });
    this.lockableDistribution = await LockableDistribution.new(this.egg.address, { from: owner });
  });

  describe("when lockable distribution contract is deployed", function () {
    it("should not be able to set lockable distribution contract if not an owner", async function () {
      await expectRevert(
        this.egg.setLockableDistributionContract(this.lockableDistribution.address, {
          from: user1,
        }),
        "Ownable: only contract owner can call this function."
      );
    });
  });

  describe("when lockable distribution contract is set up", function () {
    beforeEach(async function () {
      await this.egg.setLockableDistributionContract(this.lockableDistribution.address, {
        from: owner,
      });
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

    describe("when lockable distribution is enabled", function () {
      it("should not be able to distribute without approval", async function () {
        await expectRevert(
          this.lockableDistribution.distributeAndLock(user1, totalSupply, {
            from: owner,
          }),
          "ERC20: transfer amount exceeds allowance"
        );
      });
    });

    describe("when lockable distribution is performed", function () {
      it("should be able to use distributed tokens in a full amount only once lock duration has passed", async function () {
        await this.egg.approve(this.lockableDistribution.address, singleDistributionAmount, {
          from: owner,
        });

        await time.advanceBlock();
        let distributionTime = await time.latest();
        const receiptDistribution = await this.lockableDistribution.distributeAndLock(
          user1,
          singleDistributionAmount,
          {
            from: owner,
          }
        );
        expectEvent.inTransaction(receiptDistribution.tx, IERC20, "Transfer", {
          from: owner,
          to: user1,
          value: singleDistributionAmount,
        });
        let lockOfUser = await this.egg.lockOf(user1, {
          from: user1,
        });
        expect(lockOfUser[0]).to.be.bignumber.equal(
          singleDistributionAmount
            .mul(await this.lockableDistribution.lockPercentageBasisPoints())
            .divn(10000)
        );
        expect(lockOfUser[1]).to.be.bignumber.equal(
          distributionTime.add(await this.lockableDistribution.lockDuration())
        );

        await expectRevert(
          this.egg.transfer(owner, singleDistributionAmount, {
            from: user1,
          }),
          "ERC20Lockable: transfer amount exceeds the non-locked balance"
        );

        await time.increaseTo(
          distributionTime
            .add(await this.lockableDistribution.lockDuration())
            .add(time.duration.minutes(1))
        );
        await time.advanceBlock();

        const receiptUnlockedTransferUser1 = await this.egg.transfer(
          owner,
          singleDistributionAmount,
          {
            from: user1,
          }
        );
        expectEvent(receiptUnlockedTransferUser1, "Transfer", {
          from: user1,
          to: owner,
          value: singleDistributionAmount,
        });
      });

      describe("when batched lockable distribution is performed", function () {
        it("should be able to use distributed tokens in a full amount only once lock duration has passed", async function () {
          await this.egg.approve(
            this.lockableDistribution.address,
            singleDistributionAmount.muln(2),
            {
              from: owner,
            }
          );

          await time.advanceBlock();
          let distributionTime = await time.latest();
          const receiptDistribution = await this.lockableDistribution.distributeAndLockBatch(
            [user1, user2],
            [singleDistributionAmount, singleDistributionAmount],
            {
              from: owner,
            }
          );
          expectEvent.inTransaction(
            receiptDistribution.tx,
            IERC20,
            "Transfer",
            {
              from: owner,
              to: user1,
              value: singleDistributionAmount,
            },
            {
              from: owner,
              to: user2,
              value: singleDistributionAmount,
            }
          );
          let lockOfUser1 = await this.egg.lockOf(user1, {
            from: user1,
          });
          expect(lockOfUser1[0]).to.be.bignumber.equal(
            singleDistributionAmount
              .mul(await this.lockableDistribution.lockPercentageBasisPoints())
              .divn(10000)
          );
          expect(lockOfUser1[1]).to.be.bignumber.equal(
            distributionTime.add(await this.lockableDistribution.lockDuration())
          );
          let lockOfUser2 = await this.egg.lockOf(user1, {
            from: user1,
          });
          expect(lockOfUser2[0]).to.be.bignumber.equal(
            singleDistributionAmount
              .mul(await this.lockableDistribution.lockPercentageBasisPoints())
              .divn(10000)
          );
          expect(lockOfUser2[1]).to.be.bignumber.equal(
            distributionTime.add(await this.lockableDistribution.lockDuration())
          );

          await expectRevert(
            this.egg.transfer(owner, singleDistributionAmount, {
              from: user1,
            }),
            "ERC20Lockable: transfer amount exceeds the non-locked balance"
          );
          await expectRevert(
            this.egg.transfer(owner, singleDistributionAmount, {
              from: user2,
            }),
            "ERC20Lockable: transfer amount exceeds the non-locked balance"
          );

          await time.increaseTo(
            distributionTime
              .add(await this.lockableDistribution.lockDuration())
              .add(time.duration.minutes(1))
          );
          await time.advanceBlock();

          const receiptUnlockedTransferUser1 = await this.egg.transfer(
            owner,
            singleDistributionAmount,
            {
              from: user1,
            }
          );
          expectEvent(receiptUnlockedTransferUser1, "Transfer", {
            from: user1,
            to: owner,
            value: singleDistributionAmount,
          });
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
});
