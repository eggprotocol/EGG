// SPDX-License-Identifier: Apache license 2.0

pragma solidity ^0.7.0;

/**
 * @dev Interface of the voting smart contract that locks
 * {ERC20} voting token while election process is not finished.
 */
interface IVoting {
  /**
   * @dev Emitted when the new voting issue becomes available at `issueIndex` with
   * specified `issueDescription` and `issueEndTimestamp`.
   */
  event LogIssueCreated(uint256 issueIndex, string issueDescription, uint256 issueEndTimestamp);

  /**
   * @dev Emitted when the new vote for option `optionIndex` with weight `amount`
   * was accepted for the issue identified by `issueIndex`.
   */
  event LogVoteAccepted(uint256 issueIndex, uint8 optionIndex, uint256 amount);

  /**
   * @dev {ERC20} voting token that determines a vote weight and
   * becomes locked until the election ends.
   */
  function token() external view returns (address);

  /**
   * @dev Creates a new voting issue from a `description`, `duration`
   * and an array of `options`, returns the issue index.
   */
  function createIssue(
    string calldata description,
    uint256 duration,
    bytes32[] calldata options
  ) external returns (uint256);

  /**
   * @dev Creates the new vote for option `optionIndex` with weight `amount`
   * for the issue identified by `issueIndex`, locks `amount` of {token}.
   */
  function vote(
    uint256 amount,
    uint256 issueIndex,
    uint8 optionIndex
  ) external;

  /**
   * @dev Returns all the tokens used for voting on the issue at `issueIndex`
   * back to the voter.
   */
  function withdrawVotedTokens(uint256 issueIndex) external;

  /**
   * @dev Returns `amountToRetrieve` of the latest voting issues,
   * shifted by `offset` (may be used for pagination).
   */
  function recentIssueIndexes(uint256 amountToRetrieve, uint256 offset)
    external
    view
    returns (uint256[] memory);

  /**
   * @dev Returns issue's description, end timestamp and amount of available options.
   */
  function issueDetails(uint256 issueIndex)
    external
    view
    returns (
      string memory,
      uint256,
      uint256
    );

  /**
   * @dev Returns issue options' descriptions and total votes per each.
   */
  function issueOptions(uint256 issueIndex)
    external
    view
    returns (bytes32[] memory, uint256[] memory);
}
