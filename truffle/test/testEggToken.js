const { ether, expectEvent, expectRevert } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");

var Egg = artifacts.require("EggToken.sol");

contract("Egg", function (accounts) {
  const [owner, user1, user2] = accounts;

  const totalSupply = ether("1000");
  const lessThanTotalSupply = ether("999");
  const moreThanTotalSupply = ether("1001");
  const batchAmount = ether("500");

  beforeEach(async function () {
    this.egg = await Egg.new("Test Egg", "Egg", totalSupply, { from: owner });
  });

  describe("deployment", function () {
    describe("when contract is deployed", function () {
      it("should get correct initial balances", async function () {
        expect(await this.egg.totalSupply()).to.be.bignumber.equal(totalSupply);
        expect(await this.egg.balanceOf(owner)).to.be.bignumber.equal(totalSupply);
      });
    });

    describe("when contract is deployed", function () {
      it("should not be able to pause contract if not an owner", async function () {
        await expectRevert(
          this.egg.pause({ from: user1 }),
          "Ownable: only contract owner can call this function."
        );
      });
    });
  });

  describe("transfer", function () {
    describe("when balance is sufficient", function () {
      it("should be able to transfer tokens", async function () {
        const receipt = await this.egg.transfer(user1, totalSupply, {
          from: owner,
        });
        expectEvent(receipt, "Transfer", {
          from: owner,
          to: user1,
          value: totalSupply,
        });

        expect(await this.egg.balanceOf(owner)).to.be.bignumber.equal("0");
        expect(await this.egg.balanceOf(user1)).to.be.bignumber.equal(totalSupply);
      });
    });

    describe("when balance is sufficient", function () {
      it("should be able to transfer tokens in a batch", async function () {
        var addressesArray = [user1, user2];
        var batchArray = [batchAmount, batchAmount];
        const receipt = await this.egg.transferBatch(addressesArray, batchArray, { from: owner });
        expectEvent(
          receipt,
          "Transfer",
          {
            from: owner,
            to: user1,
            value: batchAmount,
          },
          {
            from: owner,
            to: user2,
            value: batchAmount,
          }
        );

        expect(await this.egg.balanceOf(owner)).to.be.bignumber.equal("0");
        expect(await this.egg.balanceOf(user1)).to.be.bignumber.equal(batchAmount);
        expect(await this.egg.balanceOf(user2)).to.be.bignumber.equal(batchAmount);
      });
    });

    describe("when balance is not sufficient", function () {
      it("should not be able to transfer", async function () {
        await expectRevert(
          this.egg.transfer(user1, moreThanTotalSupply, { from: owner }),
          "ERC20: transfer amount exceeds balance"
        );
      });
    });

    describe("when balance is not sufficient", function () {
      it("should not be able to transfer tokens in a batch", async function () {
        var addressesArray = [user1, user2];
        var batchArray = [batchAmount, moreThanTotalSupply];
        await expectRevert(
          this.egg.transferBatch(addressesArray, batchArray, {
            from: owner,
          }),
          "EggToken: transfer amount exceeds balance"
        );
      });
    });

    describe("when allowance is sufficient", function () {
      it("should be able to transfer tokens from another account", async function () {
        const receipt = await this.egg.approve(user1, totalSupply, {
          from: owner,
        });
        expectEvent(receipt, "Approval", {
          owner: owner,
          spender: user1,
          value: totalSupply,
        });

        await this.egg.transferFrom(owner, user2, totalSupply, {
          from: user1,
        });

        expect(await this.egg.balanceOf(owner)).to.be.bignumber.equal("0");
        expect(await this.egg.balanceOf(user2)).to.be.bignumber.equal(totalSupply);
        expect(await this.egg.balanceOf(user1)).to.be.bignumber.equal("0");
      });
    });

    describe("when allowance is not sufficient", function () {
      it("should not be able to transfer from another account more than allowed", async function () {
        await this.egg.approve(user1, lessThanTotalSupply, {
          from: owner,
        });
        await expectRevert(
          this.egg.transferFrom(owner, user2, totalSupply, {
            from: user1,
          }),
          "ERC20: transfer amount exceeds allowance"
        );
      });
    });

    describe("when paused", function () {
      it("should not be able to transfer tokens", async function () {
        await this.egg.pause({ from: owner });
        await expectRevert(
          this.egg.transfer(user1, totalSupply, { from: owner }),
          "ERC20Pausable: token transfer while paused"
        );
      });
    });
  });
});
