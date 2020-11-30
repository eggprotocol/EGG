// SPDX-License-Identifier: Apache license 2.0

pragma solidity ^0.7.0;

/**
 * @dev Interface of the ERC900 standard with custom modifications.
 *
 * See https://github.com/ethereum/EIPs/blob/master/EIPS/eip-900.md
 */
interface IStaking {
  /**
   * @dev Emitted when the `user` stakes an `amount` of tokens and
   * passes arbitrary `data`, therefore `total` is changed as well,
   * `personalStakeIndex`, `unlockedTimestamp` and `stakePercentageBasisPoints` are captured
   * according to the chosen stake option.
   */
  event LogStaked(
    address indexed user,
    uint256 amount,
    uint256 personalStakeIndex,
    uint256 unlockedTimestamp,
    uint16 stakePercentageBasisPoints,
    uint256 total,
    bytes data
  );

  /**
   * @dev Emitted when the `user` unstakes an `amount` of tokens and
   * passes arbitrary `data`, therefore `total` is changed as well,
   * `personalStakeIndex` and `stakeReward` are captured.
   */
  event LogUnstaked(
    address indexed user,
    uint256 amount,
    uint256 personalStakeIndex,
    uint256 stakeReward,
    uint256 total,
    bytes data
  );

  /**
   * @notice Stakes a certain amount of tokens, this MUST transfer the given amount from the user
   * @notice MUST trigger Staked event
   * @param stakeOptionIndex uint8 the chosen stake option
   * @param amount uint256 the amount of tokens to stake
   * @param data bytes optional data to include in the Stake event
   */
  function stake(
    uint8 stakeOptionIndex,
    uint256 amount,
    bytes calldata data
  ) external;

  /**
   * @notice Stakes a certain amount of tokens, this MUST transfer the given amount from the caller
   * @notice MUST trigger Staked event
   * @param stakeOptionIndex uint8 the chosen stake option
   * @param user address the address the tokens are staked for
   * @param amount uint256 the amount of tokens to stake
   * @param data bytes optional data to include in the Stake event
   */
  function stakeFor(
    uint8 stakeOptionIndex,
    address user,
    uint256 amount,
    bytes calldata data
  ) external;

  /**
   * @notice Unstakes tokens, this SHOULD return the given amount of tokens to the user,
   * if unstaking is currently not possible the function MUST revert
   * @notice MUST trigger Unstaked event
   * @dev Unstaking tokens is an atomic operation—either all of the tokens in a stake, or none of the tokens.
   * @dev Stake reward is minted if function is called after the stake's `unlockTimestamp`.
   * @param personalStakeIndex uint256 index of the stake to withdraw in the personalStakes mapping
   * @param data bytes optional data to include in the Unstake event
   */
  function unstake(uint256 personalStakeIndex, bytes calldata data) external;

  /**
   * @notice Returns the current total of tokens staked for an address
   * @param addr address The address to query
   * @return uint256 The number of tokens staked for the given address
   */
  function totalStakedFor(address addr) external view returns (uint256);

  /**
   * @notice Returns the current total of tokens staked
   * @return uint256 The number of tokens staked in the contract
   */
  function totalStaked() external view returns (uint256);

  /**
   * @notice Address of the token being used by the staking interface
   * @return address The address of the ERC20 token used for staking
   */
  function token() external view returns (address);

  /**
   * @notice MUST return true if the optional history functions are implemented, otherwise false
   * @dev Since we don't implement the optional interface, this always returns false
   * @return bool Whether or not the optional history functions are implemented
   */
  function supportsHistory() external pure returns (bool);

  /**
   * @notice Sets the pairs of currently available staking options,
   * which will regulate the stake duration and reward percentage.
   * Stakes that were created through the old stake options will remain unchanged.
   * @param stakeDurations uint256[] array of stake option durations
   * @param stakePercentageBasisPoints uint16[] array of stake rewarding percentages (basis points)
   */
  function setStakingOptions(
    uint256[] memory stakeDurations,
    uint16[] memory stakePercentageBasisPoints
  ) external;

  /**
   * @notice Returns the pairs of currently available staking options,
   * so that staker can choose a suitable combination of
   * stake duration and reward percentage.
   * @return stakeOptionIndexes uint256[] array of the stake option indexes used in other functions of this contract
   * @return stakeDurations uint256[] array of stake option durations
   * @return stakePercentageBasisPoints uint16[] array of stake rewarding percentages (basis points)
   */
  function getStakingOptions()
    external
    view
    returns (
      uint256[] memory stakeOptionIndexes,
      uint256[] memory stakeDurations,
      uint16[] memory stakePercentageBasisPoints
    );

  /**
   * @dev Returns the stake indexes for
   * the last `amountToRetrieve` (with `offset` for pagination)
   * personal stakes created by `user`.
   * @param user address The address to query
   * @param amountToRetrieve uint256 Configures the amount of stakes to gather data for
   * @param offset uint256 Configures the offset for results pagination
   * @return uint256[] stake indexes array
   */
  function getPersonalStakeIndexes(
    address user,
    uint256 amountToRetrieve,
    uint256 offset
  ) external view returns (uint256[] memory);

  /**
   * @dev Returns the stake unlock timestamps for
   * the last `amountToRetrieve` (with `offset` for pagination)
   * personal stakes created by `user`.
   * @param user address The address to query
   * @param amountToRetrieve uint256 Configures the amount of stakes to gather data for
   * @param offset uint256 Configures the offset for results pagination
   * @return uint256[] stake unlock timestamps array
   */
  function getPersonalStakeUnlockedTimestamps(
    address user,
    uint256 amountToRetrieve,
    uint256 offset
  ) external view returns (uint256[] memory);

  /**
   * @dev Returns the stake values of
   * the last `amountToRetrieve` (with `offset` for pagination)
   * the personal stakes created by `user`.
   * @param user address The address to query
   * @param amountToRetrieve uint256 Configures the amount of stakes to gather data for
   * @param offset uint256 Configures the offset for results pagination
   * @return uint256[] stake values array
   */
  function getPersonalStakeActualAmounts(
    address user,
    uint256 amountToRetrieve,
    uint256 offset
  ) external view returns (uint256[] memory);

  /**
   * @dev Returns the adresses of stake owners of
   * the last `amountToRetrieve` (with `offset` for pagination)
   * personal stakes created by `user`.
   * @param user address The address to query
   * @param amountToRetrieve uint256 Configures the amount of stakes to gather data for
   * @param offset uint256 Configures the offset for results pagination
   * @return address[] addresses of stake owners array
   */
  function getPersonalStakeForAddresses(
    address user,
    uint256 amountToRetrieve,
    uint256 offset
  ) external view returns (address[] memory);

  /**
   * @dev Returns the stake rewards percentage (basis points) of
   * the last `amountToRetrieve` (with `offset` for pagination)
   * personal stakes created by `user`.
   * @param user address The address to query
   * @param amountToRetrieve uint256 Configures the amount of stakes to gather data for
   * @param offset uint256 Configures the offset for results pagination
   * @return uint256[] stake rewards percentage (basis points) array
   */
  function getPersonalStakePercentageBasisPoints(
    address user,
    uint256 amountToRetrieve,
    uint256 offset
  ) external view returns (uint256[] memory);
}
