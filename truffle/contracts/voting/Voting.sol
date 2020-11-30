// SPDX-License-Identifier: Apache license 2.0

pragma solidity ^0.7.0;

import "../utils/Context.sol";
import "../utils/Ownable.sol";
import "../token/ERC20.sol";
import "../interfaces/IVoting.sol";
import "../libraries/SafeMathUint.sol";

/**
 * @dev Implementation of the {IVoting} interface.
 */
contract Voting is IVoting, Context, Ownable {
  using SafeMathUint for uint256;
  using SafeMathUint for uint8;

  ERC20 _votingToken;

  // Struct for voting options
  // id - unique option ID
  // description - arbitrary description
  // totalVotes - total amount of votes collected for this option so far
  struct IssueOption {
    uint256 id;
    bytes32 description;
    uint256 totalVotes;
  }

  // Struct for voting issues
  // description - arbitrary description
  // endTimestamp - when the issue expires (in seconds since Unix epoch)
  // issueOptions - contains all the available voting options on this issue
  // issueOptionsAmount - amount of issue options, helps to iterate through `issueOptions`
  struct Issue {
    string description;
    uint256 endTimestamp;
    mapping(uint256 => IssueOption) issueOptions;
    uint256 issueOptionsAmount;
  }

  mapping(uint256 => Issue) private issues;
  mapping(uint256 => mapping(address => uint256)) private votes;
  uint256 private lastIssueIndex;
  uint256 private lastIssueOptionId;

  /**
   * @dev Sets the {ERC20} `votingToken` which tokens
   * determine a vote weight and are locked until the election ends.
   */
  constructor(ERC20 votingToken) {
    _votingToken = votingToken;
  }

  /**
   * @dev See {IVoting-token}.
   */
  function token() external override view returns (address) {
    return address(_votingToken);
  }

  /**
   * @dev See {IVoting-createIssue}.
   */
  function createIssue(
    string calldata description,
    uint256 duration,
    bytes32[] calldata options
  ) external override onlyOwner returns (uint256) {
    uint256 endTimestamp = block.timestamp.add(duration);
    issues[lastIssueIndex].issueOptionsAmount = options.length;
    issues[lastIssueIndex].description = description;
    issues[lastIssueIndex].endTimestamp = endTimestamp;
    for (uint256 i = 0; i < options.length; i++) {
      issues[lastIssueIndex].issueOptions[i] = IssueOption({
        id: lastIssueOptionId++,
        description: options[i],
        totalVotes: 0
      });
    }

    emit LogIssueCreated(lastIssueIndex, description, endTimestamp);
    return lastIssueIndex++;
  }

  /**
   * @dev See {IVoting-vote}.
   */
  function vote(
    uint256 amount,
    uint256 issueIndex,
    uint8 optionIndex
  ) external override isValidIssue(issueIndex) {
    Issue storage targetIssue = issues[issueIndex];
    require(
      block.timestamp <= targetIssue.endTimestamp,
      "Voting: issue voting has been finished already"
    );

    require(optionIndex < targetIssue.issueOptionsAmount, "Voting: passed the wrong option index");

    require(
      _votingToken.transferFrom(_msgSender(), address(this), amount),
      "Voting: voting tokens required"
    );

    votes[targetIssue.issueOptions[optionIndex].id][_msgSender()] = votes[targetIssue
      .issueOptions[optionIndex]
      .id][_msgSender()]
      .add(amount);
    targetIssue.issueOptions[optionIndex].totalVotes = targetIssue.issueOptions[optionIndex]
      .totalVotes
      .add(amount);

    emit LogVoteAccepted(issueIndex, optionIndex, amount);
  }

  /**
   * @dev See {IVoting-withdrawVotedTokens}.
   *
   * Requirements:
   *
   * - voting issue at `issueIndex` should have a timestamp
   * `endTimestamp` that is already reached.
   * - the caller must have a non-withdrawn votes on this issue.
   * - {ERC20} `_votingToken` should call {transfer} successfully.
   */
  function withdrawVotedTokens(uint256 issueIndex) external override isValidIssue(issueIndex) {
    Issue storage targetIssue = issues[issueIndex];
    require(
      block.timestamp > targetIssue.endTimestamp,
      "Voting: issue voting hasn't been finished already"
    );

    uint256 votedTokens;
    for (uint256 i = 0; i < targetIssue.issueOptionsAmount; i++) {
      votedTokens = votedTokens.add(votes[targetIssue.issueOptions[i].id][_msgSender()]);
      votes[targetIssue.issueOptions[i].id][_msgSender()] = 0;
    }

    require(votedTokens > 0, "Voting: haven't voted or withdrawn tokens already");

    require(_votingToken.transfer(_msgSender(), votedTokens), "Voting: transfer failed");
  }

  /**
   * @dev See {IVoting-recentIssueIndexes}.
   */
  function recentIssueIndexes(uint256 amountToRetrieve, uint256 offset)
    external
    override
    view
    returns (uint256[] memory)
  {
    uint256 offsetIssueAmount = lastIssueIndex.sub(offset);
    if (amountToRetrieve > offsetIssueAmount) {
      amountToRetrieve = offsetIssueAmount;
    }
    uint256[] memory issueIndexes = new uint256[](amountToRetrieve);

    uint256 retrieved;
    for (uint256 i = lastIssueIndex.sub(1).sub(offset); i >= 0; i--) {
      issueIndexes[retrieved] = i;
      if (++retrieved >= amountToRetrieve) {
        break;
      }
    }

    return (issueIndexes);
  }

  /**
   * @dev See {IVoting-issueDetails}.
   */
  function issueDetails(uint256 issueIndex)
    external
    override
    view
    returns (
      string memory,
      uint256,
      uint256
    )
  {
    return (
      issues[issueIndex].description,
      issues[issueIndex].endTimestamp,
      issues[issueIndex].issueOptionsAmount
    );
  }

  /**
   * @dev See {IVoting-issueOptions}.
   */
  function issueOptions(uint256 issueIndex)
    external
    override
    view
    isValidIssue(issueIndex)
    returns (bytes32[] memory, uint256[] memory)
  {
    Issue storage targetIssue = issues[issueIndex];
    bytes32[] memory optionDescriptions = new bytes32[](targetIssue.issueOptionsAmount);
    uint256[] memory optionTotalVotes = new uint256[](targetIssue.issueOptionsAmount);

    for (uint256 i = 0; i < targetIssue.issueOptionsAmount; i++) {
      optionDescriptions[i] = targetIssue.issueOptions[i].description;
      optionTotalVotes[i] = targetIssue.issueOptions[i].totalVotes;
    }

    return (optionDescriptions, optionTotalVotes);
  }

  /**
   * @dev Checks if `issueIndex` points to the existing voting issue.
   */
  modifier isValidIssue(uint256 issueIndex) {
    require(issueIndex <= lastIssueIndex.sub(1), "Voting: passed the wrong issue index");
    _;
  }
}
