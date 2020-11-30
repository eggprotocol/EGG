const { ether, expectEvent, expectRevert, time } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");

var Egg = artifacts.require("EggToken.sol");
var Voting = artifacts.require("Voting.sol");

contract("Voting", function (accounts) {
  const [owner, user1, user2] = accounts;

  const totalSupply = ether("1000");
  const votingDuration = time.duration.seconds(31557600);

  before(async function () {
    await time.advanceBlock();
  });

  beforeEach(async function () {
    this.egg = await Egg.new("Test Egg", "Egg", totalSupply, { from: owner });
    this.voting = await Voting.new(this.egg.address, { from: owner });

    expect(await this.voting.token()).to.equal(this.egg.address);
    await this.egg.transfer(user1, ether("300"), { from: owner });
  });

  describe("when the caller is not an owner", function () {
    it("should not be able to create an issue", async function () {
      await expectRevert(
        this.voting.createIssue(
          "TEST ISSUE",
          votingDuration,
          [
            web3.utils.asciiToHex("TEST OPTION 1"),
            web3.utils.asciiToHex("TEST OPTION 2"),
            web3.utils.asciiToHex("TEST OPTION 3"),
          ],
          {
            from: user1,
          }
        ),
        "Ownable: only contract owner can call this function."
      );
    });
  });

  describe("when owner creates issues", function () {
    beforeEach(async function () {
      this.initTime0 = await time.latest();
      const receiptCreateIssue1 = await this.voting.createIssue(
        "TEST ISSUE 1",
        votingDuration,
        [
          web3.utils.asciiToHex("TEST OPTION 1"),
          web3.utils.asciiToHex("TEST OPTION 2"),
          web3.utils.asciiToHex("TEST OPTION 3"),
        ],
        {
          from: owner,
        }
      );
      expectEvent(receiptCreateIssue1, "LogIssueCreated", {
        issueIndex: "0",
        issueDescription: "TEST ISSUE 1",
        //issueEndTimestamp: this.initTime0.add(votingDuration),
      });

      this.initTime1 = await time.latest();
      const receiptCreateIssue2 = await this.voting.createIssue(
        "TEST ISSUE 2",
        votingDuration,
        [
          web3.utils.asciiToHex("TEST OPTION 4"),
          web3.utils.asciiToHex("TEST OPTION 5"),
          web3.utils.asciiToHex("TEST OPTION 6"),
        ],
        {
          from: owner,
        }
      );
      expectEvent(receiptCreateIssue2, "LogIssueCreated", {
        issueIndex: "1",
        issueDescription: "TEST ISSUE 2",
        //issueEndTimestamp: this.initTime1.add(votingDuration),
      });
    });

    describe("when issues are created", function () {
      it("should have the correct issues, options and voting state", async function () {
        let issue1 = await this.voting.recentIssueIndexes(1, 0, { from: user1 });
        expect(issue1).to.have.lengthOf(1);
        expect(issue1[0]).to.be.bignumber.equal("1");
        let issue1Details = await this.voting.issueDetails(1, { from: user1 });
        expect(issue1Details[0]).to.equal("TEST ISSUE 2");
        // expect(issue1Details[1]).to.be.bignumber.equal(
        //   this.initTime1.add(votingDuration)
        // );

        let issue0 = await this.voting.recentIssueIndexes(1, 1, { from: user1 });
        expect(issue0).to.have.lengthOf(1);
        expect(issue0[0]).to.be.bignumber.equal("0");
        let issue0Details = await this.voting.issueDetails(0, { from: user1 });
        expect(issue0Details[0]).to.equal("TEST ISSUE 1");
        // expect(issue0Details[1]).to.be.bignumber.equal(
        //   this.initTime0.add(votingDuration)
        // );

        let bothIssues1 = await this.voting.recentIssueIndexes(2, 0, { from: user1 });
        expect(bothIssues1).to.have.lengthOf(2);
        expect(bothIssues1[0]).to.be.bignumber.equal("1");
        expect(bothIssues1[1]).to.be.bignumber.equal("0");

        let bothIssues2 = await this.voting.recentIssueIndexes(3, 0, { from: user1 });
        expect(bothIssues2).to.have.lengthOf(2);

        let bothIssues3 = await this.voting.recentIssueIndexes(3, 1, { from: user1 });
        expect(bothIssues3).to.have.lengthOf(1);

        let issue1Options = await this.voting.issueOptions(1, { from: user1 });
        expect(issue1Options[0]).to.have.lengthOf(3);
        expect(issue1Options[1]).to.have.lengthOf(3);
        expect(web3.utils.toUtf8(issue1Options[0][0])).to.equal("TEST OPTION 4");
        expect(issue1Options[1][0]).to.be.bignumber.equal("0");
        expect(web3.utils.toUtf8(issue1Options[0][1])).to.equal("TEST OPTION 5");
        expect(issue1Options[1][1]).to.be.bignumber.equal("0");
        expect(web3.utils.toUtf8(issue1Options[0][2])).to.equal("TEST OPTION 6");
        expect(issue1Options[1][2]).to.be.bignumber.equal("0");

        let issue0Options = await this.voting.issueOptions(0, { from: user1 });
        expect(issue0Options[0]).to.have.lengthOf(3);
        expect(issue0Options[1]).to.have.lengthOf(3);
        expect(web3.utils.toUtf8(issue0Options[0][0])).to.equal("TEST OPTION 1");
        expect(issue0Options[1][0]).to.be.bignumber.equal("0");
        expect(web3.utils.toUtf8(issue0Options[0][1])).to.equal("TEST OPTION 2");
        expect(issue0Options[1][1]).to.be.bignumber.equal("0");
        expect(web3.utils.toUtf8(issue0Options[0][2])).to.equal("TEST OPTION 3");
        expect(issue0Options[1][2]).to.be.bignumber.equal("0");
      });
    });

    describe("when an allowance is not given to the voting contract", function () {
      it("should not be able to vote", async function () {
        await expectRevert(
          this.voting.vote(ether("100"), 0, 0, {
            from: user1,
          }),
          "ERC20: transfer amount exceeds allowance"
        );
      });
    });

    describe("when an allowance is given to the voting contract", function () {
      beforeEach(async function () {
        await this.egg.approve(this.voting.address, ether("300"), {
          from: user1,
        });
      });

      describe("when the wrong issue index is passed", function () {
        it("should not be able to vote", async function () {
          await expectRevert(
            this.voting.vote(ether("210"), 2, 0, {
              from: user1,
            }),
            "Voting: passed the wrong issue index"
          );
        });
      });

      describe("when the wrong option index is passed", function () {
        it("should not be able to vote", async function () {
          await expectRevert(
            this.voting.vote(ether("210"), 0, 3, {
              from: user1,
            }),
            "Voting: passed the wrong option index"
          );
        });
      });

      describe("when user votes", function () {
        beforeEach(async function () {
          const vote1 = await this.voting.vote(ether("10"), 0, 0, {
            from: user1,
          });
          expect(await this.egg.balanceOf(user1)).to.be.bignumber.equal(ether("290"));
          expectEvent(vote1, "LogVoteAccepted", {
            issueIndex: "0",
            optionIndex: "0",
            amount: ether("10"),
          });

          const vote2 = await this.voting.vote(ether("20"), 0, 1, {
            from: user1,
          });
          expect(await this.egg.balanceOf(user1)).to.be.bignumber.equal(ether("270"));
          expectEvent(vote2, "LogVoteAccepted", {
            issueIndex: "0",
            optionIndex: "1",
            amount: ether("20"),
          });

          const vote3 = await this.voting.vote(ether("30"), 0, 2, {
            from: user1,
          });
          expect(await this.egg.balanceOf(user1)).to.be.bignumber.equal(ether("240"));
          expectEvent(vote3, "LogVoteAccepted", {
            issueIndex: "0",
            optionIndex: "2",
            amount: ether("30"),
          });

          const vote4 = await this.voting.vote(ether("40"), 1, 0, {
            from: user1,
          });
          expect(await this.egg.balanceOf(user1)).to.be.bignumber.equal(ether("200"));
          expectEvent(vote4, "LogVoteAccepted", {
            issueIndex: "1",
            optionIndex: "0",
            amount: ether("40"),
          });

          const vote5 = await this.voting.vote(ether("50"), 1, 1, {
            from: user1,
          });
          expect(await this.egg.balanceOf(user1)).to.be.bignumber.equal(ether("150"));
          expectEvent(vote5, "LogVoteAccepted", {
            issueIndex: "1",
            optionIndex: "1",
            amount: ether("50"),
          });

          const vote6 = await this.voting.vote(ether("60"), 1, 2, {
            from: user1,
          });
          expect(await this.egg.balanceOf(user1)).to.be.bignumber.equal(ether("90"));
          expectEvent(vote6, "LogVoteAccepted", {
            issueIndex: "1",
            optionIndex: "2",
            amount: ether("60"),
          });
        });

        describe("when votes are processed", function () {
          it("should have the correct issues, options and voting state", async function () {
            let issue1Options = await this.voting.issueOptions(1, {
              from: user1,
            });
            expect(issue1Options[0]).to.have.lengthOf(3);
            expect(issue1Options[1]).to.have.lengthOf(3);
            expect(web3.utils.toUtf8(issue1Options[0][0])).to.equal("TEST OPTION 4");
            expect(issue1Options[1][0]).to.be.bignumber.equal(ether("40"));
            expect(web3.utils.toUtf8(issue1Options[0][1])).to.equal("TEST OPTION 5");
            expect(issue1Options[1][1]).to.be.bignumber.equal(ether("50"));
            expect(web3.utils.toUtf8(issue1Options[0][2])).to.equal("TEST OPTION 6");
            expect(issue1Options[1][2]).to.be.bignumber.equal(ether("60"));

            let issue0Options = await this.voting.issueOptions(0, {
              from: user1,
            });
            expect(issue0Options[0]).to.have.lengthOf(3);
            expect(issue0Options[1]).to.have.lengthOf(3);
            expect(web3.utils.toUtf8(issue0Options[0][0])).to.equal("TEST OPTION 1");
            expect(issue0Options[1][0]).to.be.bignumber.equal(ether("10"));
            expect(web3.utils.toUtf8(issue0Options[0][1])).to.equal("TEST OPTION 2");
            expect(issue0Options[1][1]).to.be.bignumber.equal(ether("20"));
            expect(web3.utils.toUtf8(issue0Options[0][2])).to.equal("TEST OPTION 3");
            expect(issue0Options[1][2]).to.be.bignumber.equal(ether("30"));
          });
        });

        describe("when the issue duration hasn't passed", function () {
          it("should not be able to withdraw voted tokens", async function () {
            await expectRevert(
              this.voting.withdrawVotedTokens(0, {
                from: user1,
              }),
              "Voting: issue voting hasn't been finished already"
            );
          });
        });

        describe("when the issue voting ends", function () {
          beforeEach(async function () {
            await time.increaseTo(this.initTime1.add(votingDuration).add(time.duration.minutes(5)));
            await time.advanceBlock();
          });

          describe("when voting results are finalized", function () {
            it("should not be able to vote", async function () {
              await expectRevert(
                this.voting.vote(ether("90"), 0, 0, {
                  from: user1,
                }),
                "Voting: issue voting has been finished already"
              );
            });
          });

          describe("when voting results are finalized", function () {
            it("should be able to withdraw voted tokens once", async function () {
              expect(await this.egg.balanceOf(user1)).to.be.bignumber.equal(ether("90"));

              await this.voting.withdrawVotedTokens(0, {
                from: user1,
              });
              expect(await this.egg.balanceOf(user1)).to.be.bignumber.equal(ether("150"));

              await this.voting.withdrawVotedTokens(1, {
                from: user1,
              });
              expect(await this.egg.balanceOf(user1)).to.be.bignumber.equal(ether("300"));

              await expectRevert(
                this.voting.withdrawVotedTokens(0, {
                  from: user1,
                }),
                "Voting: haven't voted or withdrawn tokens already"
              );

              await expectRevert(
                this.voting.withdrawVotedTokens(1, {
                  from: user1,
                }),
                "Voting: haven't voted or withdrawn tokens already"
              );
            });
          });

          describe("when the wrong issue index is passed", function () {
            it("should not be able to withdraw voted tokens", async function () {
              await expectRevert(
                this.voting.withdrawVotedTokens(2, {
                  from: user1,
                }),
                "Voting: passed the wrong issue index"
              );
            });
          });

          describe("when user hasn't voted", function () {
            it("should not be able to withdraw voted tokens", async function () {
              await expectRevert(
                this.voting.withdrawVotedTokens(0, {
                  from: user2,
                }),
                "Voting: haven't voted or withdrawn tokens already"
              );
            });
          });
        });
      });
    });
  });
});
