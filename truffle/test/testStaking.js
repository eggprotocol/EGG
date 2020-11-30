const { ether, expectEvent, expectRevert, time } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");

var Egg = artifacts.require("EggToken.sol");
var Staking = artifacts.require("Staking.sol");
var IERC20 = artifacts.require("IERC20.sol");

contract("Staking", function (accounts) {
  const [owner, user1, user2] = accounts;

  const totalSupply = ether("1000");
  const stakeDuration1 = 31557600;
  const stakeDuration2 = 15778800;
  const stakeDuration3 = 63115200;
  const stakePercentageBasisPoints1 = 200;
  const stakePercentageBasisPoints2 = 100;
  const stakePercentageBasisPoints3 = 400;
  const stakeAmount1 = ether("200");
  const stakeAmount2 = ether("100");
  const stakeAmount3 = ether("50");

  before(async function () {
    await time.advanceBlock();
  });

  beforeEach(async function () {
    this.egg = await Egg.new("Test Egg", "Egg", totalSupply, { from: owner });
    this.staking = await Staking.new(this.egg.address, { from: owner });
    this.initTime = await time.latest();
  });

  describe("when staking contract is deployed", function () {
    it("should not be able to set staking contract if not an owner", async function () {
      await expectRevert(
        this.egg.setStakingContract(this.staking.address, { from: user1 }),
        "Ownable: only contract owner can call this function."
      );
    });
  });

  describe("when staking contract is set up", function () {
    beforeEach(async function () {
      await this.egg.setStakingContract(this.staking.address, { from: owner });
      expect(await this.staking.token()).to.equal(this.egg.address);
      await this.egg.transfer(user1, stakeAmount1.add(stakeAmount2).add(stakeAmount3), {
        from: owner,
      });
    });

    describe("when staking contract is set up", function () {
      it("should not be able to set the staking options if not an owner", async function () {
        await expectRevert(
          this.staking.setStakingOptions(
            [stakeDuration1, stakeDuration2],
            [stakePercentageBasisPoints1, stakePercentageBasisPoints2],
            {
              from: user1,
            }
          ),
          "Ownable: only contract owner can call this function."
        );
      });
    });

    describe("when staking contract is set up", function () {
      it("should not be able to stake while the staking options are not set up by the owner", async function () {
        await this.egg.approve(this.staking.address, stakeAmount1, {
          from: user1,
        });
        await expectRevert(
          this.staking.stake(0, stakeAmount1, web3.utils.fromAscii(""), {
            from: user1,
          }),
          "Staking: no available staking options at the moment."
        );
      });
    });

    describe("when staking contract is set up", function () {
      it("should not be able to set the invalid staking options", async function () {
        await expectRevert(
          this.staking.setStakingOptions(
            [stakeDuration1, stakeDuration2],
            [stakePercentageBasisPoints1],
            {
              from: owner,
            }
          ),
          "Staking: stake duration and percentage basis points arrays should be equal in size and non-empty"
        );
        await expectRevert(
          this.staking.setStakingOptions(
            [stakeDuration1],
            [stakePercentageBasisPoints1, stakePercentageBasisPoints2],
            {
              from: owner,
            }
          ),
          "Staking: stake duration and percentage basis points arrays should be equal in size and non-empty"
        );
        await expectRevert(
          this.staking.setStakingOptions([], [], {
            from: owner,
          }),
          "Staking: stake duration and percentage basis points arrays should be equal in size and non-empty"
        );
      });
    });

    describe("when staking contract is set up", function () {
      it("should be able to set and reset the valid staking options", async function () {
        await this.staking.setStakingOptions([stakeDuration2], [stakePercentageBasisPoints2], {
          from: owner,
        });
        let stakingOptions1 = await this.staking.getStakingOptions({
          from: owner,
        });
        expect(stakingOptions1[0]).to.have.lengthOf(1);
        expect(stakingOptions1[1]).to.have.lengthOf(1);
        expect(stakingOptions1[2]).to.have.lengthOf(1);
        expect(stakingOptions1[0][0]).to.be.bignumber.equal(web3.utils.toBN(0));
        expect(stakingOptions1[1][0]).to.be.bignumber.equal(web3.utils.toBN(stakeDuration2));
        expect(stakingOptions1[2][0]).to.be.bignumber.equal(
          web3.utils.toBN(stakePercentageBasisPoints2)
        );

        await this.staking.setStakingOptions(
          [stakeDuration1, stakeDuration2, stakeDuration3],
          [stakePercentageBasisPoints1, stakePercentageBasisPoints2, stakePercentageBasisPoints3],
          {
            from: owner,
          }
        );
        let stakingOptions2 = await this.staking.getStakingOptions({
          from: owner,
        });
        expect(stakingOptions2[0]).to.have.lengthOf(3);
        expect(stakingOptions2[1]).to.have.lengthOf(3);
        expect(stakingOptions2[2]).to.have.lengthOf(3);
        expect(stakingOptions2[0][0]).to.be.bignumber.equal(web3.utils.toBN(0));
        expect(stakingOptions2[1][0]).to.be.bignumber.equal(web3.utils.toBN(stakeDuration1));
        expect(stakingOptions2[2][0]).to.be.bignumber.equal(
          web3.utils.toBN(stakePercentageBasisPoints1)
        );
        expect(stakingOptions2[0][1]).to.be.bignumber.equal(web3.utils.toBN(1));
        expect(stakingOptions2[1][1]).to.be.bignumber.equal(web3.utils.toBN(stakeDuration2));
        expect(stakingOptions2[2][1]).to.be.bignumber.equal(
          web3.utils.toBN(stakePercentageBasisPoints2)
        );
      });
    });

    describe("when staking options are set up", function () {
      beforeEach(async function () {
        await this.staking.setStakingOptions(
          [stakeDuration1, stakeDuration2, stakeDuration3],
          [stakePercentageBasisPoints1, stakePercentageBasisPoints2, stakePercentageBasisPoints3],
          {
            from: owner,
          }
        );
      });

      describe("when token allowance is not given in a full amount", function () {
        it("should not be able to stake", async function () {
          await expectRevert(
            this.staking.stake(0, stakeAmount1, web3.utils.fromAscii(""), {
              from: user1,
            }),
            "ERC20: transfer amount exceeds allowance"
          );

          await this.egg.approve(this.staking.address, stakeAmount2, {
            from: user1,
          });
          await expectRevert(
            this.staking.stake(0, stakeAmount1, web3.utils.fromAscii(""), {
              from: user1,
            }),
            "ERC20: transfer amount exceeds allowance"
          );
        });
      });

      describe("when token allowance is given in a full amount", function () {
        it("should be able to stake for other account", async function () {
          await this.egg.approve(this.staking.address, stakeAmount1.add(stakeAmount2), {
            from: user1,
          });

          const receiptStakeFor = await this.staking.stakeFor(
            0,
            user2,
            stakeAmount1.add(stakeAmount2),
            web3.utils.fromAscii(""),
            {
              from: user1,
            }
          );
          expectEvent(receiptStakeFor, "LogStaked", {
            user: user2,
            amount: stakeAmount1.add(stakeAmount2),
            total: stakeAmount1.add(stakeAmount2),
            data: web3.utils.fromAscii(""),
          });
        });
      });

      describe("when token allowance is given in a full amount from own account", function () {
        it("should be able to stake and get a correct stake information", async function () {
          let stakingOptions = await this.staking.getStakingOptions({
            from: user1,
          });
          let stakeIndex1 = stakingOptions[0][0];
          let stakeDuration1 = stakingOptions[1][0];
          let stakePercentage1 = stakingOptions[2][0];
          let stakeIndex2 = stakingOptions[0][1];
          let stakeDuration2 = stakingOptions[1][1];
          let stakePercentage2 = stakingOptions[2][1];

          await this.egg.approve(this.staking.address, stakeAmount1, {
            from: user1,
          });

          await time.advanceBlock();
          let stakeTime1 = await time.latest();
          const receiptStake1 = await this.staking.stake(
            stakeIndex1,
            stakeAmount1,
            web3.utils.fromAscii(""),
            {
              from: user1,
            }
          );
          expectEvent(receiptStake1, "LogStaked", {
            user: user1,
            amount: stakeAmount1,
            personalStakeIndex: web3.utils.toBN(0),
            unlockedTimestamp: stakeTime1.add(stakeDuration1),
            stakePercentageBasisPoints: web3.utils.toBN(stakePercentage1),
            total: stakeAmount1,
            data: web3.utils.fromAscii(""),
          });
          expect(await this.staking.totalStaked()).to.be.bignumber.equal(stakeAmount1);
          expect(await this.egg.balanceOf(user1)).to.be.bignumber.equal(
            stakeAmount2.add(stakeAmount3)
          );
          let personalStakeIndexesAfterStaking1 = await this.staking.getPersonalStakeIndexes(
            user1,
            1,
            0,
            {
              from: user1,
            }
          );
          let personalStakeUnlockedTimestampsAfterStaking1 = await this.staking.getPersonalStakeUnlockedTimestamps(
            user1,
            1,
            0,
            {
              from: user1,
            }
          );
          let personalStakeActualAmountsAfterStaking1 = await this.staking.getPersonalStakeActualAmounts(
            user1,
            1,
            0,
            {
              from: user1,
            }
          );
          let personalStakeForAddressesAfterStaking1 = await this.staking.getPersonalStakeForAddresses(
            user1,
            1,
            0,
            {
              from: user1,
            }
          );
          let personalStakePercentageBasisPointsAfterStaking1 = await this.staking.getPersonalStakePercentageBasisPoints(
            user1,
            1,
            0,
            {
              from: user1,
            }
          );
          let personalStakesAfterStaking1 = await this.staking.getPersonalStakes(user1, 1, 0, {
            from: user1,
          });
          expect(personalStakeIndexesAfterStaking1).to.have.lengthOf(1);
          expect(personalStakeUnlockedTimestampsAfterStaking1).to.have.lengthOf(1);
          expect(personalStakeActualAmountsAfterStaking1).to.have.lengthOf(1);
          expect(personalStakeForAddressesAfterStaking1).to.have.lengthOf(1);
          expect(personalStakePercentageBasisPointsAfterStaking1).to.have.lengthOf(1);
          expect(personalStakesAfterStaking1[0]).to.have.lengthOf(1);
          expect(personalStakesAfterStaking1[1]).to.have.lengthOf(1);
          expect(personalStakesAfterStaking1[2]).to.have.lengthOf(1);
          expect(personalStakesAfterStaking1[3]).to.have.lengthOf(1);
          expect(personalStakesAfterStaking1[4]).to.have.lengthOf(1);
          expect(personalStakeIndexesAfterStaking1[0]).to.be.bignumber.equal(web3.utils.toBN(0));
          expect(personalStakeUnlockedTimestampsAfterStaking1[0]).to.be.bignumber.equal(
            stakeTime1.add(stakeDuration1)
          );
          expect(personalStakeActualAmountsAfterStaking1[0]).to.be.bignumber.equal(stakeAmount1);
          expect(personalStakeForAddressesAfterStaking1[0]).to.equal(user1);
          expect(personalStakePercentageBasisPointsAfterStaking1[0]).to.be.bignumber.equal(
            web3.utils.toBN(stakePercentage1)
          );
          expect(personalStakesAfterStaking1[0][0]).to.be.bignumber.equal(
            personalStakeIndexesAfterStaking1[0]
          );
          expect(personalStakesAfterStaking1[1][0]).to.be.bignumber.equal(
            personalStakeUnlockedTimestampsAfterStaking1[0]
          );
          expect(personalStakesAfterStaking1[2][0]).to.be.bignumber.equal(
            personalStakeActualAmountsAfterStaking1[0]
          );
          expect(personalStakesAfterStaking1[3][0]).to.equal(
            personalStakeForAddressesAfterStaking1[0]
          );
          expect(personalStakesAfterStaking1[4][0]).to.be.bignumber.equal(
            personalStakePercentageBasisPointsAfterStaking1[0]
          );

          await this.egg.approve(this.staking.address, stakeAmount2, {
            from: user1,
          });

          await time.advanceBlock();
          let stakeTime2 = await time.latest();
          const receiptStake2 = await this.staking.stake(
            stakeIndex2,
            stakeAmount2,
            web3.utils.fromAscii(""),
            {
              from: user1,
            }
          );
          expectEvent(receiptStake2, "LogStaked", {
            user: user1,
            amount: stakeAmount2,
            personalStakeIndex: web3.utils.toBN(1),
            unlockedTimestamp: stakeTime2.add(stakeDuration2),
            stakePercentageBasisPoints: web3.utils.toBN(stakePercentage2),
            total: stakeAmount1.add(stakeAmount2),
            data: web3.utils.fromAscii(""),
          });
          expect(await this.staking.totalStaked()).to.be.bignumber.equal(
            stakeAmount1.add(stakeAmount2)
          );
          expect(await this.egg.balanceOf(user1)).to.be.bignumber.equal(stakeAmount3);
          let personalStakeIndexesAfterStaking2 = await this.staking.getPersonalStakeIndexes(
            user1,
            2,
            0,
            {
              from: user1,
            }
          );
          let personalStakeUnlockedTimestampsAfterStaking2 = await this.staking.getPersonalStakeUnlockedTimestamps(
            user1,
            2,
            0,
            {
              from: user1,
            }
          );
          let personalStakeActualAmountsAfterStaking2 = await this.staking.getPersonalStakeActualAmounts(
            user1,
            2,
            0,
            {
              from: user1,
            }
          );
          let personalStakeForAddressesAfterStaking2 = await this.staking.getPersonalStakeForAddresses(
            user1,
            2,
            0,
            {
              from: user1,
            }
          );
          let personalStakePercentageBasisPointsAfterStaking2 = await this.staking.getPersonalStakePercentageBasisPoints(
            user1,
            2,
            0,
            {
              from: user1,
            }
          );
          let personalStakesAfterStaking2 = await this.staking.getPersonalStakes(user1, 2, 0, {
            from: user1,
          });
          expect(personalStakeIndexesAfterStaking2).to.have.lengthOf(2);
          expect(personalStakeUnlockedTimestampsAfterStaking2).to.have.lengthOf(2);
          expect(personalStakeActualAmountsAfterStaking2).to.have.lengthOf(2);
          expect(personalStakeForAddressesAfterStaking2).to.have.lengthOf(2);
          expect(personalStakePercentageBasisPointsAfterStaking2).to.have.lengthOf(2);
          expect(personalStakesAfterStaking2[1]).to.have.lengthOf(2);
          expect(personalStakesAfterStaking2[2]).to.have.lengthOf(2);
          expect(personalStakesAfterStaking2[3]).to.have.lengthOf(2);
          expect(personalStakesAfterStaking2[4]).to.have.lengthOf(2);
          expect(personalStakeIndexesAfterStaking2[0]).to.be.bignumber.equal(web3.utils.toBN(1));
          expect(personalStakeIndexesAfterStaking2[1]).to.be.bignumber.equal(web3.utils.toBN(0));
          expect(personalStakeUnlockedTimestampsAfterStaking2[0]).to.be.bignumber.equal(
            stakeTime2.add(stakeDuration2)
          );
          expect(personalStakeUnlockedTimestampsAfterStaking2[1]).to.be.bignumber.equal(
            stakeTime1.add(stakeDuration1)
          );
          expect(personalStakeActualAmountsAfterStaking2[0]).to.be.bignumber.equal(stakeAmount2);
          expect(personalStakeActualAmountsAfterStaking2[1]).to.be.bignumber.equal(stakeAmount1);
          expect(personalStakeForAddressesAfterStaking2[0]).to.equal(user1);
          expect(personalStakeForAddressesAfterStaking2[1]).to.equal(user1);
          expect(personalStakePercentageBasisPointsAfterStaking2[0]).to.be.bignumber.equal(
            web3.utils.toBN(stakePercentage2)
          );
          expect(personalStakePercentageBasisPointsAfterStaking2[1]).to.be.bignumber.equal(
            web3.utils.toBN(stakePercentage1)
          );
          expect(personalStakesAfterStaking2[0][0]).to.be.bignumber.equal(
            personalStakeIndexesAfterStaking2[0]
          );
          expect(personalStakesAfterStaking2[0][1]).to.be.bignumber.equal(
            personalStakeIndexesAfterStaking2[1]
          );
          expect(personalStakesAfterStaking2[1][0]).to.be.bignumber.equal(
            personalStakeUnlockedTimestampsAfterStaking2[0]
          );
          expect(personalStakesAfterStaking2[1][1]).to.be.bignumber.equal(
            personalStakeUnlockedTimestampsAfterStaking2[1]
          );
          expect(personalStakesAfterStaking2[2][0]).to.be.bignumber.equal(
            personalStakeActualAmountsAfterStaking2[0]
          );
          expect(personalStakesAfterStaking2[2][1]).to.be.bignumber.equal(
            personalStakeActualAmountsAfterStaking2[1]
          );
          expect(personalStakesAfterStaking2[3][0]).to.equal(
            personalStakeForAddressesAfterStaking2[0]
          );
          expect(personalStakesAfterStaking2[3][1]).to.equal(
            personalStakeForAddressesAfterStaking2[1]
          );
          expect(personalStakesAfterStaking2[4][0]).to.be.bignumber.equal(
            personalStakePercentageBasisPointsAfterStaking2[0]
          );
          expect(personalStakesAfterStaking2[4][1]).to.be.bignumber.equal(
            personalStakePercentageBasisPointsAfterStaking2[1]
          );
        });
      });

      describe("when stake is created", function () {
        beforeEach(async function () {
          await this.egg.approve(this.staking.address, stakeAmount1, {
            from: user1,
          });

          let stakingOptions = await this.staking.getStakingOptions({
            from: user1,
          });
          let stakeOptionIndex1 = stakingOptions[0][0];

          await this.staking.stake(stakeOptionIndex1, stakeAmount1, web3.utils.fromAscii(""), {
            from: user1,
          });
        });

        describe("when the wrong personal stake index is passed", function () {
          it("should not be able to unstake", async function () {
            await expectRevert(
              this.staking.unstake(100, web3.utils.fromAscii(""), {
                from: user1,
              }),
              "Staking: passed the wrong personal stake index"
            );
          });
        });

        describe("when the correct personal stake index is passed", function () {
          it("should not be able to unstake the same stake twice", async function () {
            await this.staking.unstake(0, web3.utils.fromAscii(""), {
              from: user1,
            });

            await expectRevert(
              this.staking.unstake(0, web3.utils.fromAscii(""), {
                from: user1,
              }),
              "Staking: already withdrawn this stake"
            );
          });
        });

        describe("when stake duration is finished", function () {
          beforeEach(async function () {
            let personalStakeUnlockedTimestamps = await this.staking.getPersonalStakeUnlockedTimestamps(
              user1,
              1,
              0,
              {
                from: user1,
              }
            );
            await time.increaseTo(personalStakeUnlockedTimestamps[0].add(time.duration.minutes(1)));
            await time.advanceBlock();
          });

          describe("when two more stakes are created and stake duration is finished for the two of three stakes", function () {
            beforeEach(async function () {
              let stakingOptions = await this.staking.getStakingOptions({
                from: user1,
              });
              let stakeOptionIndex2 = stakingOptions[0][1];
              let stakeOptionIndex3 = stakingOptions[0][2];

              await this.egg.approve(this.staking.address, stakeAmount2, {
                from: user1,
              });
              await this.staking.stake(stakeOptionIndex2, stakeAmount2, web3.utils.fromAscii(""), {
                from: user1,
              });

              await this.egg.approve(this.staking.address, stakeAmount3, {
                from: user1,
              });
              await this.staking.stake(stakeOptionIndex3, stakeAmount3, web3.utils.fromAscii(""), {
                from: user1,
              });

              let personalStakeUnlockedTimestamps = await this.staking.getPersonalStakeUnlockedTimestamps(
                user1,
                3,
                0,
                {
                  from: user1,
                }
              );
              let latestUnlockedTimestamp = personalStakeUnlockedTimestamps[1];
              if (personalStakeUnlockedTimestamps[2] > latestUnlockedTimestamp) {
                latestUnlockedTimestamp = personalStakeUnlockedTimestamps[2];
              }
              await time.increaseTo(latestUnlockedTimestamp.add(time.duration.minutes(1)));
              await time.advanceBlock();
            });

            describe("when multiple stakes are created", function () {
              it("should be able to get the correct stake info with limiting and offsetting", async function () {
                let stakingOptions = await this.staking.getStakingOptions({
                  from: user1,
                });
                let stakePercentage1 = stakingOptions[2][0];
                let stakePercentage2 = stakingOptions[2][1];
                let stakePercentage3 = stakingOptions[2][2];

                let personalStakes = await this.staking.getPersonalStakes(user1, 3, 0, {
                  from: user1,
                });
                expect(personalStakes[0]).to.have.lengthOf(3);
                expect(personalStakes[2]).to.have.lengthOf(3);
                expect(personalStakes[3]).to.have.lengthOf(3);
                expect(personalStakes[4]).to.have.lengthOf(3);
                expect(personalStakes[0][0]).to.be.bignumber.equal(web3.utils.toBN(2));
                expect(personalStakes[0][1]).to.be.bignumber.equal(web3.utils.toBN(1));
                expect(personalStakes[0][2]).to.be.bignumber.equal(web3.utils.toBN(0));
                expect(personalStakes[2][0]).to.be.bignumber.equal(stakeAmount3);
                expect(personalStakes[2][1]).to.be.bignumber.equal(stakeAmount2);
                expect(personalStakes[2][2]).to.be.bignumber.equal(stakeAmount1);
                expect(personalStakes[3][0]).to.equal(user1);
                expect(personalStakes[3][1]).to.equal(user1);
                expect(personalStakes[3][2]).to.equal(user1);
                expect(personalStakes[4][0]).to.be.bignumber.equal(
                  web3.utils.toBN(stakePercentage3)
                );
                expect(personalStakes[4][1]).to.be.bignumber.equal(
                  web3.utils.toBN(stakePercentage2)
                );
                expect(personalStakes[4][2]).to.be.bignumber.equal(
                  web3.utils.toBN(stakePercentage1)
                );

                let personalStakesRequestedMoreThanPresent = await this.staking.getPersonalStakes(
                  user1,
                  5,
                  0,
                  {
                    from: user1,
                  }
                );
                expect(personalStakesRequestedMoreThanPresent[0]).to.have.lengthOf(3);
                expect(personalStakesRequestedMoreThanPresent[2]).to.have.lengthOf(3);
                expect(personalStakesRequestedMoreThanPresent[3]).to.have.lengthOf(3);
                expect(personalStakesRequestedMoreThanPresent[4]).to.have.lengthOf(3);
                expect(personalStakesRequestedMoreThanPresent[0][0]).to.be.bignumber.equal(
                  web3.utils.toBN(2)
                );
                expect(personalStakesRequestedMoreThanPresent[0][1]).to.be.bignumber.equal(
                  web3.utils.toBN(1)
                );
                expect(personalStakesRequestedMoreThanPresent[0][2]).to.be.bignumber.equal(
                  web3.utils.toBN(0)
                );
                expect(personalStakesRequestedMoreThanPresent[2][0]).to.be.bignumber.equal(
                  stakeAmount3
                );
                expect(personalStakesRequestedMoreThanPresent[2][1]).to.be.bignumber.equal(
                  stakeAmount2
                );
                expect(personalStakesRequestedMoreThanPresent[2][2]).to.be.bignumber.equal(
                  stakeAmount1
                );
                expect(personalStakesRequestedMoreThanPresent[3][0]).to.equal(user1);
                expect(personalStakesRequestedMoreThanPresent[3][1]).to.equal(user1);
                expect(personalStakesRequestedMoreThanPresent[3][2]).to.equal(user1);
                expect(personalStakesRequestedMoreThanPresent[4][0]).to.be.bignumber.equal(
                  web3.utils.toBN(stakePercentage3)
                );
                expect(personalStakesRequestedMoreThanPresent[4][1]).to.be.bignumber.equal(
                  web3.utils.toBN(stakePercentage2)
                );
                expect(personalStakesRequestedMoreThanPresent[4][2]).to.be.bignumber.equal(
                  web3.utils.toBN(stakePercentage1)
                );

                let personalStakesRequestedSingle = await this.staking.getPersonalStakes(
                  user1,
                  1,
                  0,
                  {
                    from: user1,
                  }
                );
                expect(personalStakesRequestedSingle[0]).to.have.lengthOf(1);
                expect(personalStakesRequestedSingle[2]).to.have.lengthOf(1);
                expect(personalStakesRequestedSingle[3]).to.have.lengthOf(1);
                expect(personalStakesRequestedSingle[4]).to.have.lengthOf(1);
                expect(personalStakesRequestedSingle[0][0]).to.be.bignumber.equal(
                  web3.utils.toBN(2)
                );
                expect(personalStakesRequestedSingle[2][0]).to.be.bignumber.equal(stakeAmount3);
                expect(personalStakesRequestedSingle[3][0]).to.equal(user1);
                expect(personalStakesRequestedSingle[4][0]).to.be.bignumber.equal(
                  web3.utils.toBN(stakePercentage3)
                );

                let personalStakesRequestedSingleWithOffset = await this.staking.getPersonalStakes(
                  user1,
                  1,
                  1,
                  {
                    from: user1,
                  }
                );
                expect(personalStakesRequestedSingleWithOffset[0]).to.have.lengthOf(1);
                expect(personalStakesRequestedSingleWithOffset[2]).to.have.lengthOf(1);
                expect(personalStakesRequestedSingleWithOffset[3]).to.have.lengthOf(1);
                expect(personalStakesRequestedSingleWithOffset[4]).to.have.lengthOf(1);
                expect(personalStakesRequestedSingleWithOffset[0][0]).to.be.bignumber.equal(
                  web3.utils.toBN(1)
                );
                expect(personalStakesRequestedSingleWithOffset[2][0]).to.be.bignumber.equal(
                  stakeAmount2
                );
                expect(personalStakesRequestedSingleWithOffset[3][0]).to.equal(user1);
                expect(personalStakesRequestedSingleWithOffset[4][0]).to.be.bignumber.equal(
                  web3.utils.toBN(stakePercentage2)
                );

                await expectRevert(
                  this.staking.getPersonalStakes(user1, 1, 3, {
                    from: user1,
                  }),
                  "SafeMath: subtraction overflow"
                );
              });
            });

            describe("when passed the correct personal stake indexes", function () {
              it("should be able to unstake two stakes with staking rewards and one stake without a staking reward", async function () {
                let stakingOptions = await this.staking.getStakingOptions({
                  from: user1,
                });
                let stakePercentage1 = stakingOptions[2][0];
                let stakeReward1 = stakeAmount1.mul(stakePercentage1).divn(10000);
                let stakePercentage2 = stakingOptions[2][1];
                let stakeReward2 = stakeAmount2.mul(stakePercentage2).divn(10000);
                let stakePercentage3 = stakingOptions[2][2];

                expect(await this.staking.totalStaked()).to.be.bignumber.equal(
                  stakeAmount1.add(stakeAmount2).add(stakeAmount3)
                );
                expect(await this.egg.balanceOf(user1)).to.be.bignumber.equal(ether("0"));

                let personalStakeIndexesBeforeUnstaking = await this.staking.getPersonalStakeIndexes(
                  user1,
                  3,
                  0,
                  {
                    from: user1,
                  }
                );
                let personalStakeActualAmountsBeforeUnstaking = await this.staking.getPersonalStakeActualAmounts(
                  user1,
                  3,
                  0,
                  {
                    from: user1,
                  }
                );
                let personalStakeForAddressesBeforeUnstaking = await this.staking.getPersonalStakeForAddresses(
                  user1,
                  3,
                  0,
                  {
                    from: user1,
                  }
                );
                let personalStakePercentageBasisPointsBeforeUnstaking = await this.staking.getPersonalStakePercentageBasisPoints(
                  user1,
                  3,
                  0,
                  {
                    from: user1,
                  }
                );
                let personalStakesBeforeUnstaking = await this.staking.getPersonalStakes(
                  user1,
                  3,
                  0,
                  {
                    from: user1,
                  }
                );
                expect(personalStakeIndexesBeforeUnstaking).to.have.lengthOf(3);
                expect(personalStakeActualAmountsBeforeUnstaking).to.have.lengthOf(3);
                expect(personalStakeForAddressesBeforeUnstaking).to.have.lengthOf(3);
                expect(personalStakePercentageBasisPointsBeforeUnstaking).to.have.lengthOf(3);
                expect(personalStakesBeforeUnstaking[0]).to.have.lengthOf(3);
                expect(personalStakesBeforeUnstaking[2]).to.have.lengthOf(3);
                expect(personalStakesBeforeUnstaking[3]).to.have.lengthOf(3);
                expect(personalStakesBeforeUnstaking[4]).to.have.lengthOf(3);
                expect(personalStakeIndexesBeforeUnstaking[0]).to.be.bignumber.equal(
                  web3.utils.toBN(2)
                );
                expect(personalStakeIndexesBeforeUnstaking[1]).to.be.bignumber.equal(
                  web3.utils.toBN(1)
                );
                expect(personalStakeIndexesBeforeUnstaking[2]).to.be.bignumber.equal(
                  web3.utils.toBN(0)
                );
                expect(personalStakeActualAmountsBeforeUnstaking[0]).to.be.bignumber.equal(
                  stakeAmount3
                );
                expect(personalStakeActualAmountsBeforeUnstaking[1]).to.be.bignumber.equal(
                  stakeAmount2
                );
                expect(personalStakeActualAmountsBeforeUnstaking[2]).to.be.bignumber.equal(
                  stakeAmount1
                );
                expect(personalStakeForAddressesBeforeUnstaking[0]).to.equal(user1);
                expect(personalStakeForAddressesBeforeUnstaking[1]).to.equal(user1);
                expect(personalStakeForAddressesBeforeUnstaking[2]).to.equal(user1);
                expect(personalStakePercentageBasisPointsBeforeUnstaking[0]).to.be.bignumber.equal(
                  web3.utils.toBN(stakePercentage3)
                );
                expect(personalStakePercentageBasisPointsBeforeUnstaking[1]).to.be.bignumber.equal(
                  web3.utils.toBN(stakePercentage2)
                );
                expect(personalStakePercentageBasisPointsBeforeUnstaking[2]).to.be.bignumber.equal(
                  web3.utils.toBN(stakePercentage1)
                );
                expect(personalStakesBeforeUnstaking[0][0]).to.be.bignumber.equal(
                  personalStakeIndexesBeforeUnstaking[0]
                );
                expect(personalStakesBeforeUnstaking[0][1]).to.be.bignumber.equal(
                  personalStakeIndexesBeforeUnstaking[1]
                );
                expect(personalStakesBeforeUnstaking[0][2]).to.be.bignumber.equal(
                  personalStakeIndexesBeforeUnstaking[2]
                );
                expect(personalStakesBeforeUnstaking[2][0]).to.be.bignumber.equal(
                  personalStakeActualAmountsBeforeUnstaking[0]
                );
                expect(personalStakesBeforeUnstaking[2][1]).to.be.bignumber.equal(
                  personalStakeActualAmountsBeforeUnstaking[1]
                );
                expect(personalStakesBeforeUnstaking[2][2]).to.be.bignumber.equal(
                  personalStakeActualAmountsBeforeUnstaking[2]
                );
                expect(personalStakesBeforeUnstaking[3][0]).to.equal(
                  personalStakeForAddressesBeforeUnstaking[0]
                );
                expect(personalStakesBeforeUnstaking[3][1]).to.equal(
                  personalStakeForAddressesBeforeUnstaking[1]
                );
                expect(personalStakesBeforeUnstaking[3][2]).to.equal(
                  personalStakeForAddressesBeforeUnstaking[2]
                );
                expect(personalStakesBeforeUnstaking[4][0]).to.be.bignumber.equal(
                  personalStakePercentageBasisPointsBeforeUnstaking[0]
                );
                expect(personalStakesBeforeUnstaking[4][1]).to.be.bignumber.equal(
                  personalStakePercentageBasisPointsBeforeUnstaking[1]
                );
                expect(personalStakesBeforeUnstaking[4][2]).to.be.bignumber.equal(
                  personalStakePercentageBasisPointsBeforeUnstaking[2]
                );

                const receiptUnstake1 = await this.staking.unstake(0, web3.utils.fromAscii(""), {
                  from: user1,
                });
                expectEvent(receiptUnstake1, "LogUnstaked", {
                  user: user1,
                  amount: stakeAmount1,
                  personalStakeIndex: web3.utils.toBN(0),
                  stakeReward: stakeReward1,
                  total: stakeAmount2.add(stakeAmount3),
                  data: web3.utils.fromAscii(""),
                });
                expectEvent.inTransaction(
                  receiptUnstake1.tx,
                  IERC20,
                  "Transfer",
                  {
                    from: this.staking.address,
                    to: user1,
                    value: stakeAmount1,
                  },
                  {
                    from: "0x",
                    to: user1,
                    value: stakeReward1,
                  }
                );
                expect(await this.egg.balanceOf(user1)).to.be.bignumber.equal(
                  stakeAmount1.add(stakeReward1)
                );

                let personalStakeActualAmountsAfterUnstaking1 = await this.staking.getPersonalStakeActualAmounts(
                  user1,
                  3,
                  0,
                  {
                    from: user1,
                  }
                );
                let personalStakesAfterUnstaking1 = await this.staking.getPersonalStakes(
                  user1,
                  3,
                  0,
                  {
                    from: user1,
                  }
                );
                expect(personalStakeActualAmountsAfterUnstaking1).to.have.lengthOf(3);
                expect(personalStakesAfterUnstaking1[2]).to.have.lengthOf(3);
                expect(personalStakeActualAmountsAfterUnstaking1[0]).to.be.bignumber.equal(
                  stakeAmount3
                );
                expect(personalStakeActualAmountsAfterUnstaking1[1]).to.be.bignumber.equal(
                  stakeAmount2
                );
                expect(personalStakeActualAmountsAfterUnstaking1[2]).to.be.bignumber.equal(
                  web3.utils.toBN(0)
                );
                expect(personalStakesAfterUnstaking1[2][0]).to.be.bignumber.equal(
                  personalStakeActualAmountsAfterUnstaking1[0]
                );
                expect(personalStakesAfterUnstaking1[2][1]).to.be.bignumber.equal(
                  personalStakeActualAmountsAfterUnstaking1[1]
                );
                expect(personalStakesAfterUnstaking1[2][2]).to.be.bignumber.equal(
                  personalStakeActualAmountsAfterUnstaking1[2]
                );

                const receiptUnstake2 = await this.staking.unstake(1, web3.utils.fromAscii(""), {
                  from: user1,
                });
                expectEvent(receiptUnstake2, "LogUnstaked", {
                  user: user1,
                  amount: stakeAmount2,
                  personalStakeIndex: web3.utils.toBN(1),
                  stakeReward: stakeReward2,
                  total: stakeAmount3,
                  data: web3.utils.fromAscii(""),
                });
                expectEvent.inTransaction(
                  receiptUnstake2.tx,
                  IERC20,
                  "Transfer",
                  {
                    from: this.staking.address,
                    to: user1,
                    value: stakeAmount2,
                  },
                  {
                    from: "0x",
                    to: user1,
                    value: stakeReward2,
                  }
                );
                expect(await this.egg.balanceOf(user1)).to.be.bignumber.equal(
                  stakeAmount2.add(stakeReward2).add(stakeAmount1).add(stakeReward1)
                );

                let personalStakeActualAmountsAfterUnstaking2 = await this.staking.getPersonalStakeActualAmounts(
                  user1,
                  3,
                  0,
                  {
                    from: user1,
                  }
                );
                let personalStakesAfterUnstaking2 = await this.staking.getPersonalStakes(
                  user1,
                  3,
                  0,
                  {
                    from: user1,
                  }
                );
                expect(personalStakeActualAmountsAfterUnstaking2).to.have.lengthOf(3);
                expect(personalStakesAfterUnstaking2[2]).to.have.lengthOf(3);
                expect(personalStakeActualAmountsAfterUnstaking2[0]).to.be.bignumber.equal(
                  stakeAmount3
                );
                expect(personalStakeActualAmountsAfterUnstaking2[1]).to.be.bignumber.equal(
                  web3.utils.toBN(0)
                );
                expect(personalStakeActualAmountsAfterUnstaking2[2]).to.be.bignumber.equal(
                  web3.utils.toBN(0)
                );
                expect(personalStakesAfterUnstaking2[2][0]).to.be.bignumber.equal(
                  personalStakeActualAmountsAfterUnstaking2[0]
                );
                expect(personalStakesAfterUnstaking2[2][1]).to.be.bignumber.equal(
                  personalStakeActualAmountsAfterUnstaking2[1]
                );
                expect(personalStakesAfterUnstaking2[2][2]).to.be.bignumber.equal(
                  personalStakeActualAmountsAfterUnstaking2[2]
                );

                const receiptUnstake3 = await this.staking.unstake(2, web3.utils.fromAscii(""), {
                  from: user1,
                });
                expectEvent(receiptUnstake3, "LogUnstaked", {
                  user: user1,
                  amount: stakeAmount3,
                  personalStakeIndex: web3.utils.toBN(2),
                  stakeReward: ether("0"),
                  total: ether("0"),
                  data: web3.utils.fromAscii(""),
                });
                expectEvent.inTransaction(receiptUnstake3.tx, IERC20, "Transfer", {
                  from: this.staking.address,
                  to: user1,
                  value: stakeAmount3,
                });
                expect(await this.egg.balanceOf(user1)).to.be.bignumber.equal(
                  stakeAmount2
                    .add(stakeReward2)
                    .add(stakeAmount1)
                    .add(stakeReward1)
                    .add(stakeAmount3)
                );
                let personalStakeIndexesAfterAllUnstaking = await this.staking.getPersonalStakeIndexes(
                  user1,
                  3,
                  0,
                  {
                    from: user1,
                  }
                );
                let personalStakeActualAmountsAfterAllUnstaking = await this.staking.getPersonalStakeActualAmounts(
                  user1,
                  3,
                  0,
                  {
                    from: user1,
                  }
                );
                let personalStakeForAddressesAfterAllUnstaking = await this.staking.getPersonalStakeForAddresses(
                  user1,
                  3,
                  0,
                  {
                    from: user1,
                  }
                );
                let personalStakePercentageBasisPointsAfterAllUnstaking = await this.staking.getPersonalStakePercentageBasisPoints(
                  user1,
                  3,
                  0,
                  {
                    from: user1,
                  }
                );
                let personalStakesAfterAllUnstaking = await this.staking.getPersonalStakes(
                  user1,
                  3,
                  0,
                  {
                    from: user1,
                  }
                );
                expect(personalStakeIndexesAfterAllUnstaking).to.have.lengthOf(3);
                expect(personalStakeActualAmountsAfterAllUnstaking).to.have.lengthOf(3);
                expect(personalStakeForAddressesAfterAllUnstaking).to.have.lengthOf(3);
                expect(personalStakePercentageBasisPointsAfterAllUnstaking).to.have.lengthOf(3);
                expect(personalStakesAfterAllUnstaking[0]).to.have.lengthOf(3);
                expect(personalStakesAfterAllUnstaking[2]).to.have.lengthOf(3);
                expect(personalStakesAfterAllUnstaking[3]).to.have.lengthOf(3);
                expect(personalStakesAfterAllUnstaking[4]).to.have.lengthOf(3);
                expect(personalStakeIndexesAfterAllUnstaking[0]).to.be.bignumber.equal(
                  web3.utils.toBN(2)
                );
                expect(personalStakeIndexesAfterAllUnstaking[1]).to.be.bignumber.equal(
                  web3.utils.toBN(1)
                );
                expect(personalStakeIndexesAfterAllUnstaking[2]).to.be.bignumber.equal(
                  web3.utils.toBN(0)
                );
                expect(personalStakeActualAmountsAfterAllUnstaking[0]).to.be.bignumber.equal(
                  web3.utils.toBN(0)
                );
                expect(personalStakeActualAmountsAfterAllUnstaking[1]).to.be.bignumber.equal(
                  web3.utils.toBN(0)
                );
                expect(personalStakeActualAmountsAfterAllUnstaking[2]).to.be.bignumber.equal(
                  web3.utils.toBN(0)
                );
                expect(personalStakeForAddressesAfterAllUnstaking[0]).to.equal(user1);
                expect(personalStakeForAddressesAfterAllUnstaking[1]).to.equal(user1);
                expect(personalStakeForAddressesAfterAllUnstaking[2]).to.equal(user1);
                expect(
                  personalStakePercentageBasisPointsAfterAllUnstaking[0]
                ).to.be.bignumber.equal(stakePercentage3);
                expect(
                  personalStakePercentageBasisPointsAfterAllUnstaking[1]
                ).to.be.bignumber.equal(stakePercentage2);
                expect(
                  personalStakePercentageBasisPointsAfterAllUnstaking[2]
                ).to.be.bignumber.equal(stakePercentage1);
                expect(personalStakesAfterAllUnstaking[0][0]).to.be.bignumber.equal(
                  personalStakeIndexesAfterAllUnstaking[0]
                );
                expect(personalStakesAfterAllUnstaking[0][1]).to.be.bignumber.equal(
                  personalStakeIndexesAfterAllUnstaking[1]
                );
                expect(personalStakesAfterAllUnstaking[0][2]).to.be.bignumber.equal(
                  personalStakeIndexesAfterAllUnstaking[2]
                );
                expect(personalStakesAfterAllUnstaking[2][0]).to.be.bignumber.equal(
                  personalStakeActualAmountsAfterAllUnstaking[0]
                );
                expect(personalStakesAfterAllUnstaking[2][1]).to.be.bignumber.equal(
                  personalStakeActualAmountsAfterAllUnstaking[1]
                );
                expect(personalStakesAfterAllUnstaking[2][2]).to.be.bignumber.equal(
                  personalStakeActualAmountsAfterAllUnstaking[2]
                );
                expect(personalStakesAfterAllUnstaking[3][0]).to.equal(
                  personalStakeForAddressesAfterAllUnstaking[0]
                );
                expect(personalStakesAfterAllUnstaking[3][1]).to.equal(
                  personalStakeForAddressesAfterAllUnstaking[1]
                );
                expect(personalStakesAfterAllUnstaking[3][2]).to.equal(
                  personalStakeForAddressesAfterAllUnstaking[2]
                );
                expect(personalStakesAfterAllUnstaking[4][0]).to.be.bignumber.equal(
                  personalStakePercentageBasisPointsAfterAllUnstaking[0]
                );
                expect(personalStakesAfterAllUnstaking[4][1]).to.be.bignumber.equal(
                  personalStakePercentageBasisPointsAfterAllUnstaking[1]
                );
                expect(personalStakesAfterAllUnstaking[4][2]).to.be.bignumber.equal(
                  personalStakePercentageBasisPointsAfterAllUnstaking[2]
                );
              });
            });
          });

          describe("when another stake is created for other account and stake duration is finished", function () {
            beforeEach(async function () {
              await this.egg.approve(this.staking.address, stakeAmount2, {
                from: user1,
              });

              let stakingOptions = await this.staking.getStakingOptions({
                from: user1,
              });
              let stakeOptionIndex2 = stakingOptions[0][1];

              await this.staking.stakeFor(
                stakeOptionIndex2,
                user2,
                stakeAmount2,
                web3.utils.fromAscii(""),
                {
                  from: user1,
                }
              );

              let personalStakeUnlockedTimestampsUser1 = await this.staking.getPersonalStakeUnlockedTimestamps(
                user1,
                2,
                0,
                {
                  from: user1,
                }
              );
              let personalStakeUnlockedTimestampsUser2 = await this.staking.getPersonalStakeUnlockedTimestamps(
                user2,
                2,
                0,
                {
                  from: user2,
                }
              );
              let latestUnlockedTimestamp = personalStakeUnlockedTimestampsUser1[0];
              if (personalStakeUnlockedTimestampsUser2[0] > latestUnlockedTimestamp) {
                latestUnlockedTimestamp = personalStakeUnlockedTimestampsUser2[0];
              }
              await time.increaseTo(latestUnlockedTimestamp.add(time.duration.minutes(1)));
              await time.advanceBlock();
            });

            describe("when passed the correct personal stake indexes", function () {
              it("should be able to unstake both stakes", async function () {
                let stakingOptions = await this.staking.getStakingOptions({
                  from: user1,
                });
                let stakePercentage1 = stakingOptions[2][0];
                let stakeReward1 = stakeAmount1.mul(stakePercentage1).divn(10000);
                let stakePercentage2 = stakingOptions[2][1];
                let stakeReward2 = stakeAmount2.mul(stakePercentage2).divn(10000);

                expect(await this.staking.totalStaked()).to.be.bignumber.equal(
                  stakeAmount1.add(stakeAmount2)
                );
                expect(await this.egg.balanceOf(user1)).to.be.bignumber.equal(stakeAmount3);
                expect(await this.egg.balanceOf(user2)).to.be.bignumber.equal(ether("0"));

                let personalStakeIndexesBeforeUnstakingUser1 = await this.staking.getPersonalStakeIndexes(
                  user1,
                  2,
                  0,
                  {
                    from: user1,
                  }
                );
                let personalStakeActualAmountsBeforeUnstakingUser1 = await this.staking.getPersonalStakeActualAmounts(
                  user1,
                  2,
                  0,
                  {
                    from: user1,
                  }
                );
                let personalStakeForAddressesBeforeUnstakingUser1 = await this.staking.getPersonalStakeForAddresses(
                  user1,
                  2,
                  0,
                  {
                    from: user1,
                  }
                );
                let personalStakePercentageBasisPointsBeforeUnstakingUser1 = await this.staking.getPersonalStakePercentageBasisPoints(
                  user1,
                  2,
                  0,
                  {
                    from: user1,
                  }
                );
                let personalStakesBeforeUnstakingUser1 = await this.staking.getPersonalStakes(
                  user1,
                  2,
                  0,
                  {
                    from: user1,
                  }
                );
                expect(personalStakeIndexesBeforeUnstakingUser1).to.have.lengthOf(1);
                expect(personalStakeActualAmountsBeforeUnstakingUser1).to.have.lengthOf(1);
                expect(personalStakeForAddressesBeforeUnstakingUser1).to.have.lengthOf(1);
                expect(personalStakePercentageBasisPointsBeforeUnstakingUser1).to.have.lengthOf(1);
                expect(personalStakesBeforeUnstakingUser1[0]).to.have.lengthOf(1);
                expect(personalStakesBeforeUnstakingUser1[2]).to.have.lengthOf(1);
                expect(personalStakesBeforeUnstakingUser1[3]).to.have.lengthOf(1);
                expect(personalStakesBeforeUnstakingUser1[4]).to.have.lengthOf(1);
                expect(personalStakeIndexesBeforeUnstakingUser1[0]).to.be.bignumber.equal(
                  web3.utils.toBN(0)
                );
                expect(personalStakeActualAmountsBeforeUnstakingUser1[0]).to.be.bignumber.equal(
                  stakeAmount1
                );
                expect(personalStakeForAddressesBeforeUnstakingUser1[0]).to.equal(user1);
                expect(
                  personalStakePercentageBasisPointsBeforeUnstakingUser1[0]
                ).to.be.bignumber.equal(web3.utils.toBN(stakePercentage1));
                expect(personalStakesBeforeUnstakingUser1[0][0]).to.be.bignumber.equal(
                  personalStakeIndexesBeforeUnstakingUser1[0]
                );
                expect(personalStakesBeforeUnstakingUser1[2][0]).to.be.bignumber.equal(
                  personalStakeActualAmountsBeforeUnstakingUser1[0]
                );
                expect(personalStakesBeforeUnstakingUser1[3][0]).to.equal(
                  personalStakeForAddressesBeforeUnstakingUser1[0]
                );
                expect(personalStakesBeforeUnstakingUser1[4][0]).to.be.bignumber.equal(
                  personalStakePercentageBasisPointsBeforeUnstakingUser1[0]
                );
                let personalStakeIndexesBeforeUnstakingUser2 = await this.staking.getPersonalStakeIndexes(
                  user2,
                  2,
                  0,
                  {
                    from: user2,
                  }
                );
                let personalStakeActualAmountsBeforeUnstakingUser2 = await this.staking.getPersonalStakeActualAmounts(
                  user2,
                  2,
                  0,
                  {
                    from: user2,
                  }
                );
                let personalStakeForAddressesBeforeUnstakingUser2 = await this.staking.getPersonalStakeForAddresses(
                  user2,
                  2,
                  0,
                  {
                    from: user2,
                  }
                );
                let personalStakePercentageBasisPointsBeforeUnstakingUser2 = await this.staking.getPersonalStakePercentageBasisPoints(
                  user2,
                  2,
                  0,
                  {
                    from: user2,
                  }
                );
                let personalStakesBeforeUnstakingUser2 = await this.staking.getPersonalStakes(
                  user2,
                  2,
                  0,
                  {
                    from: user2,
                  }
                );
                expect(personalStakeIndexesBeforeUnstakingUser2).to.have.lengthOf(1);
                expect(personalStakeActualAmountsBeforeUnstakingUser2).to.have.lengthOf(1);
                expect(personalStakeForAddressesBeforeUnstakingUser2).to.have.lengthOf(1);
                expect(personalStakePercentageBasisPointsBeforeUnstakingUser2).to.have.lengthOf(1);
                expect(personalStakesBeforeUnstakingUser2[0]).to.have.lengthOf(1);
                expect(personalStakesBeforeUnstakingUser2[2]).to.have.lengthOf(1);
                expect(personalStakesBeforeUnstakingUser2[3]).to.have.lengthOf(1);
                expect(personalStakesBeforeUnstakingUser2[4]).to.have.lengthOf(1);
                expect(personalStakeIndexesBeforeUnstakingUser2[0]).to.be.bignumber.equal(
                  web3.utils.toBN(0)
                );
                expect(personalStakeActualAmountsBeforeUnstakingUser2[0]).to.be.bignumber.equal(
                  stakeAmount2
                );
                expect(personalStakeForAddressesBeforeUnstakingUser2[0]).to.equal(user2);
                expect(
                  personalStakePercentageBasisPointsBeforeUnstakingUser2[0]
                ).to.be.bignumber.equal(web3.utils.toBN(stakePercentage2));
                expect(personalStakesBeforeUnstakingUser2[0][0]).to.be.bignumber.equal(
                  personalStakeIndexesBeforeUnstakingUser2[0]
                );
                expect(personalStakesBeforeUnstakingUser2[2][0]).to.be.bignumber.equal(
                  personalStakeActualAmountsBeforeUnstakingUser2[0]
                );
                expect(personalStakesBeforeUnstakingUser2[3][0]).to.equal(
                  personalStakeForAddressesBeforeUnstakingUser2[0]
                );
                expect(personalStakesBeforeUnstakingUser2[4][0]).to.be.bignumber.equal(
                  personalStakePercentageBasisPointsBeforeUnstakingUser2[0]
                );

                const receiptUnstake1 = await this.staking.unstake(
                  personalStakeIndexesBeforeUnstakingUser1[0],
                  web3.utils.fromAscii(""),
                  {
                    from: user1,
                  }
                );
                expectEvent(receiptUnstake1, "LogUnstaked", {
                  user: user1,
                  amount: stakeAmount1,
                  personalStakeIndex: personalStakeIndexesBeforeUnstakingUser1[0],
                  stakeReward: stakeReward1,
                  total: ether("0"),
                  data: web3.utils.fromAscii(""),
                });
                expectEvent.inTransaction(
                  receiptUnstake1.tx,
                  IERC20,
                  "Transfer",
                  {
                    from: this.staking.address,
                    to: user1,
                    value: stakeAmount1,
                  },
                  {
                    from: "0x",
                    to: user1,
                    value: stakeReward1,
                  }
                );
                expect(await this.egg.balanceOf(user1)).to.be.bignumber.equal(
                  stakeAmount1.add(stakeReward1).add(stakeAmount3)
                );
                let personalStakeActualAmountsAfterUnstaking1User1 = await this.staking.getPersonalStakeActualAmounts(
                  user1,
                  2,
                  0,
                  {
                    from: user1,
                  }
                );
                let personalStakeForAddressesAfterUnstaking1User1 = await this.staking.getPersonalStakeForAddresses(
                  user1,
                  2,
                  0,
                  {
                    from: user1,
                  }
                );
                let personalStakesAfterUnstaking1User1 = await this.staking.getPersonalStakes(
                  user1,
                  2,
                  0,
                  {
                    from: user1,
                  }
                );
                expect(personalStakeActualAmountsAfterUnstaking1User1).to.have.lengthOf(1);
                expect(personalStakeForAddressesAfterUnstaking1User1).to.have.lengthOf(1);
                expect(personalStakesAfterUnstaking1User1[2]).to.have.lengthOf(1);
                expect(personalStakesAfterUnstaking1User1[3]).to.have.lengthOf(1);
                expect(personalStakeActualAmountsAfterUnstaking1User1[0]).to.be.bignumber.equal(
                  web3.utils.toBN(0)
                );
                expect(personalStakeForAddressesAfterUnstaking1User1[0]).to.equal(user1);
                expect(personalStakesAfterUnstaking1User1[2][0]).to.be.bignumber.equal(
                  personalStakeActualAmountsAfterUnstaking1User1[0]
                );
                expect(personalStakesAfterUnstaking1User1[3][0]).to.equal(
                  personalStakeForAddressesAfterUnstaking1User1[0]
                );
                let personalStakeActualAmountsAfterUnstaking1User2 = await this.staking.getPersonalStakeActualAmounts(
                  user2,
                  2,
                  0,
                  {
                    from: user2,
                  }
                );
                let personalStakeForAddressesAfterUnstaking1User2 = await this.staking.getPersonalStakeForAddresses(
                  user2,
                  2,
                  0,
                  {
                    from: user2,
                  }
                );
                let personalStakesAfterUnstaking1User2 = await this.staking.getPersonalStakes(
                  user2,
                  2,
                  0,
                  {
                    from: user2,
                  }
                );
                expect(personalStakeActualAmountsAfterUnstaking1User2).to.have.lengthOf(1);
                expect(personalStakeForAddressesAfterUnstaking1User2).to.have.lengthOf(1);
                expect(personalStakesAfterUnstaking1User2[2]).to.have.lengthOf(1);
                expect(personalStakesAfterUnstaking1User2[3]).to.have.lengthOf(1);
                expect(personalStakeActualAmountsAfterUnstaking1User2[0]).to.be.bignumber.equal(
                  stakeAmount2
                );
                expect(personalStakeForAddressesAfterUnstaking1User2[0]).to.equal(user2);
                expect(personalStakesAfterUnstaking1User2[2][0]).to.be.bignumber.equal(
                  personalStakeActualAmountsAfterUnstaking1User2[0]
                );
                expect(personalStakesAfterUnstaking1User2[3][0]).to.equal(
                  personalStakeForAddressesAfterUnstaking1User2[0]
                );

                const receiptUnstake2 = await this.staking.unstake(
                  personalStakeIndexesBeforeUnstakingUser2[0],
                  web3.utils.fromAscii(""),
                  {
                    from: user2,
                  }
                );
                expectEvent(receiptUnstake2, "LogUnstaked", {
                  user: user2,
                  amount: stakeAmount2,
                  personalStakeIndex: personalStakeIndexesBeforeUnstakingUser2[0],
                  stakeReward: stakeReward2,
                  total: ether("0"),
                  data: web3.utils.fromAscii(""),
                });
                expectEvent.inTransaction(
                  receiptUnstake2.tx,
                  IERC20,
                  "Transfer",
                  {
                    from: this.staking.address,
                    to: user2,
                    value: stakeAmount2,
                  },
                  {
                    from: "0x",
                    to: user2,
                    value: stakeReward2,
                  }
                );
                expect(await this.egg.balanceOf(user2)).to.be.bignumber.equal(
                  stakeAmount2.add(stakeReward2)
                );
                let personalStakeActualAmountsAfterUnstaking2User1 = await this.staking.getPersonalStakeActualAmounts(
                  user1,
                  2,
                  0,
                  {
                    from: user1,
                  }
                );
                let personalStakeForAddressesAfterUnstaking2User1 = await this.staking.getPersonalStakeForAddresses(
                  user1,
                  2,
                  0,
                  {
                    from: user1,
                  }
                );
                let personalStakesAfterUnstaking2User1 = await this.staking.getPersonalStakes(
                  user1,
                  2,
                  0,
                  {
                    from: user1,
                  }
                );
                expect(personalStakeActualAmountsAfterUnstaking2User1).to.have.lengthOf(1);
                expect(personalStakeForAddressesAfterUnstaking2User1).to.have.lengthOf(1);
                expect(personalStakesAfterUnstaking2User1[2]).to.have.lengthOf(1);
                expect(personalStakesAfterUnstaking2User1[3]).to.have.lengthOf(1);
                expect(personalStakeActualAmountsAfterUnstaking2User1[0]).to.be.bignumber.equal(
                  web3.utils.toBN(0)
                );
                expect(personalStakeForAddressesAfterUnstaking2User1[0]).to.equal(user1);
                expect(personalStakesAfterUnstaking2User1[2][0]).to.be.bignumber.equal(
                  personalStakeActualAmountsAfterUnstaking2User1[0]
                );
                expect(personalStakesAfterUnstaking2User1[3][0]).to.equal(
                  personalStakeForAddressesAfterUnstaking2User1[0]
                );
                let personalStakeActualAmountsAfterUnstaking2User2 = await this.staking.getPersonalStakeActualAmounts(
                  user2,
                  2,
                  0,
                  {
                    from: user1,
                  }
                );
                let personalStakeForAddressesAfterUnstaking2User2 = await this.staking.getPersonalStakeForAddresses(
                  user2,
                  2,
                  0,
                  {
                    from: user1,
                  }
                );
                let personalStakesAfterUnstaking2User2 = await this.staking.getPersonalStakes(
                  user2,
                  2,
                  0,
                  {
                    from: user1,
                  }
                );
                expect(personalStakeActualAmountsAfterUnstaking2User2).to.have.lengthOf(1);
                expect(personalStakeForAddressesAfterUnstaking2User2).to.have.lengthOf(1);
                expect(personalStakesAfterUnstaking2User2[2]).to.have.lengthOf(1);
                expect(personalStakesAfterUnstaking2User2[3]).to.have.lengthOf(1);
                expect(personalStakeActualAmountsAfterUnstaking2User2[0]).to.be.bignumber.equal(
                  web3.utils.toBN(0)
                );
                expect(personalStakeForAddressesAfterUnstaking2User2[0]).to.equal(user2);
                expect(personalStakesAfterUnstaking2User2[2][0]).to.be.bignumber.equal(
                  personalStakeActualAmountsAfterUnstaking2User2[0]
                );
                expect(personalStakesAfterUnstaking2User2[3][0]).to.equal(
                  personalStakeForAddressesAfterUnstaking2User2[0]
                );
              });
            });
          });
        });
      });
    });
  });
});
