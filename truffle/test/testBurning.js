const { ether, expectEvent, expectRevert } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");

var Egg = artifacts.require("EggToken.sol");
var Burning = artifacts.require("Burning.sol");
var IBurning = artifacts.require("IBurning.sol");

contract("Burning", function (accounts) {
  const [owner, user] = accounts;

  const totalSupply = ether("1000");
  const burnLimit = ether("100");
  const singleBurnAmount = ether("60");

  beforeEach(async function () {
    this.egg = await Egg.new("Test Egg", "Egg", totalSupply, { from: owner });
    this.burning = await Burning.new(this.egg.address, burnLimit, singleBurnAmount, {
      from: owner,
    });
    expect(await this.burning.burnLimit()).to.be.bignumber.equal(burnLimit);
    expect(await this.burning.singleBurnAmount()).to.be.bignumber.equal(singleBurnAmount);
  });

  describe("when burning contract is deployed", function () {
    it("should not be able to set burning contract if not an owner", async function () {
      await expectRevert(
        this.egg.setBurningContract(this.burning.address, burnLimit, {
          from: user,
        }),
        "Ownable: only contract owner can call this function."
      );
    });
  });

  describe("when burning contract is set up", function () {
    beforeEach(async function () {
      await this.egg.setBurningContract(this.burning.address, burnLimit, {
        from: owner,
      });
    });

    describe("when burning is enabled", function () {
      it("should not be able to trigger burning directly", async function () {
        await expectRevert(
          this.burning.burn({
            from: owner,
          }),
          "Burning: only token contract can burn tokens"
        );
      });
    });

    describe("when burning is enabled", function () {
      it("should be able to burn tokens until limit reached", async function () {
        expect(await this.burning.burned()).to.be.bignumber.equal("0");
        expect(await this.egg.totalSupply()).to.be.bignumber.equal(totalSupply.add(burnLimit));
        expect(await this.egg.balanceOf(this.burning.address)).to.be.bignumber.equal(burnLimit);

        const receiptBurn1 = await this.egg.periodicBurn({
          from: owner,
        });
        expectEvent.inTransaction(receiptBurn1.tx, IBurning, "LogPeriodicTokenBurn", {
          burningContract: this.burning.address,
          value: singleBurnAmount,
        });
        expect(await this.burning.burned()).to.be.bignumber.equal(singleBurnAmount);
        expect(await this.egg.totalSupply()).to.be.bignumber.equal(
          totalSupply.add(burnLimit).sub(singleBurnAmount)
        );
        expect(await this.egg.balanceOf(this.burning.address)).to.be.bignumber.equal(
          burnLimit.sub(singleBurnAmount)
        );

        const receiptBurn2 = await this.egg.periodicBurn({
          from: owner,
        });
        expectEvent.inTransaction(receiptBurn2.tx, IBurning, "LogPeriodicTokenBurn", {
          burningContract: this.burning.address,
          value: burnLimit.sub(singleBurnAmount),
        });
        expect(await this.burning.burned()).to.be.bignumber.equal(burnLimit);
        expect(await this.egg.totalSupply()).to.be.bignumber.equal(totalSupply);
        expect(await this.egg.balanceOf(this.burning.address)).to.be.bignumber.equal(ether("0"));

        await expectRevert(
          this.egg.periodicBurn({
            from: owner,
          }),
          "Burning: reached the burning limit"
        );
      });
    });
  });
});
