// SPDX-License-Identifier: Apache license 2.0

pragma solidity ^0.7.0;

import "../token/ERC20Mintable.sol";
import "../interfaces/IStaking.sol";
import "../libraries/SafeMathUint.sol";
import "../utils/Context.sol";
import "../utils/Ownable.sol";

/**
 * @dev Implementation of the {IStaking} interface.
 *
 * Provides a set of operations to enable staking of the {ERC20Mintable} token.
 */
contract Staking is IStaking, Context, Ownable {
  using SafeMathUint for uint256;

  ERC20Mintable _stakingToken;

  // To save on gas, rather than create a separate mapping for totalStakedFor & personalStakes,
  // both data structures are stored in a single mapping for a given addresses.
  // It's possible to have a non-existing personalStakes, but have tokens in totalStakedFor
  // if other users are staking on behalf of a given address.
  mapping(address => StakeContract) public _stakeHolders;
  mapping(uint256 => StakeOption[]) private _stakeOptions;
  uint256 private _currentStakeOptionArrayIndex;

  // Struct for staking options
  // stakeDuration - seconds to pass before the stake unlocks
  // stakePercentageBasisPoints - the staking reward percentage (basis points)
  struct StakeOption {
    uint256 stakeDuration;
    uint16 stakePercentageBasisPoints;
  }

  // Struct for personal stakes (i.e., stakes made by this address)
  // unlockedTimestamp - when the stake unlocks (in seconds since Unix epoch)
  // actualAmount - the amount of tokens in the stake
  // stakedFor - the address the stake was staked for
  struct Stake {
    uint256 unlockedTimestamp;
    uint256 actualAmount;
    address stakedFor;
    uint256 stakePercentageBasisPoints;
  }

  // Struct for all stake metadata at a particular address
  // totalStakedFor - the number of tokens staked for this address
  // personalStakesLastIndex - index of the last stake in the personalStakes mapping
  // personalStakes - append only mapping of stakes made by this address
  // exists - whether or not there are stakes that involve this address
  struct StakeContract {
    uint256 totalStakedFor;
    uint256 personalStakesLastIndex;
    mapping(uint256 => Stake) personalStakes;
    bool exists;
  }

  /**
   * @dev Sets the {ERC20Mintable} staking token.
   */
  constructor(ERC20Mintable stakingToken) {
    _stakingToken = stakingToken;
  }

  /**
   * @dev See {IStaking-setStakingOptions}
   *
   * Requirements:
   *
   * - `stakeDurations` and `stakePercentageBasisPoints` arrays passed to
   * this function cannot be empty or have a different length.
   */
  function setStakingOptions(
    uint256[] memory stakeDurations,
    uint16[] memory stakePercentageBasisPoints
  ) external override onlyOwner {
    require(
      stakeDurations.length == stakePercentageBasisPoints.length && stakeDurations.length > 0,
      "Staking: stake duration and percentage basis points arrays should be equal in size and non-empty"
    );

    _currentStakeOptionArrayIndex = _currentStakeOptionArrayIndex.add(1);
    for (uint256 i = 0; i < stakeDurations.length; i++) {
      _stakeOptions[_currentStakeOptionArrayIndex].push(
        StakeOption(stakeDurations[i], stakePercentageBasisPoints[i])
      );
    }
  }

  /**
   * @dev See {IStaking-getStakingOptions}
   */
  function getStakingOptions()
    external
    override
    view
    returns (
      uint256[] memory stakeOptionIndexes,
      uint256[] memory stakeDurations,
      uint16[] memory stakePercentageBasisPoints
    )
  {
    stakeOptionIndexes = new uint256[](_stakeOptions[_currentStakeOptionArrayIndex].length);
    stakeDurations = new uint256[](_stakeOptions[_currentStakeOptionArrayIndex].length);
    stakePercentageBasisPoints = new uint16[](_stakeOptions[_currentStakeOptionArrayIndex].length);

    for (uint256 i = 0; i < _stakeOptions[_currentStakeOptionArrayIndex].length; i++) {
      stakeOptionIndexes[i] = i;
      stakeDurations[i] = _stakeOptions[_currentStakeOptionArrayIndex][i].stakeDuration;
      stakePercentageBasisPoints[i] = _stakeOptions[_currentStakeOptionArrayIndex][i]
        .stakePercentageBasisPoints;
    }

    return (stakeOptionIndexes, stakeDurations, stakePercentageBasisPoints);
  }

  /**
   * @dev See {IStaking-getPersonalStakeIndexes}
   */
  function getPersonalStakeIndexes(
    address user,
    uint256 amountToRetrieve,
    uint256 offset
  ) external override view returns (uint256[] memory) {
    uint256[] memory indexes;
    (indexes, , , , ) = getPersonalStakes(user, amountToRetrieve, offset);

    return indexes;
  }

  /**
   * @dev See {IStaking-getPersonalStakeUnlockedTimestamps}
   */
  function getPersonalStakeUnlockedTimestamps(
    address user,
    uint256 amountToRetrieve,
    uint256 offset
  ) external override view returns (uint256[] memory) {
    uint256[] memory timestamps;
    (, timestamps, , , ) = getPersonalStakes(user, amountToRetrieve, offset);

    return timestamps;
  }

  /**
   * @dev See {IStaking-getPersonalStakeActualAmounts}
   */
  function getPersonalStakeActualAmounts(
    address user,
    uint256 amountToRetrieve,
    uint256 offset
  ) external override view returns (uint256[] memory) {
    uint256[] memory actualAmounts;
    (, , actualAmounts, , ) = getPersonalStakes(user, amountToRetrieve, offset);

    return actualAmounts;
  }

  /**
   * @dev See {IStaking-getPersonalStakeForAddresses}
   */
  function getPersonalStakeForAddresses(
    address user,
    uint256 amountToRetrieve,
    uint256 offset
  ) external override view returns (address[] memory) {
    address[] memory stakedFor;
    (, , , stakedFor, ) = getPersonalStakes(user, amountToRetrieve, offset);

    return stakedFor;
  }

  /**
   * @dev See {IStaking-getPersonalStakePercentageBasisPoints}
   */
  function getPersonalStakePercentageBasisPoints(
    address user,
    uint256 amountToRetrieve,
    uint256 offset
  ) external override view returns (uint256[] memory) {
    uint256[] memory stakePercentageBasisPoints;
    (, , , , stakePercentageBasisPoints) = getPersonalStakes(user, amountToRetrieve, offset);

    return stakePercentageBasisPoints;
  }

  /**
   * @dev Helper function to get specific properties of all of the personal stakes created by the `user`
   * @param user address The address to query
   * @return (uint256[], uint256[], address[], uint256[] memory)
   *  timestamps array, actualAmounts array, stakedFor array, stakePercentageBasisPoints array
   */
  function getPersonalStakes(
    address user,
    uint256 amountToRetrieve,
    uint256 offset
  )
    public
    view
    returns (
      uint256[] memory,
      uint256[] memory,
      uint256[] memory,
      address[] memory,
      uint256[] memory
    )
  {
    StakeContract storage stakeContract = _stakeHolders[user];

    uint256 offsetStakeAmount = stakeContract.personalStakesLastIndex.sub(offset);
    if (amountToRetrieve > offsetStakeAmount) {
      amountToRetrieve = offsetStakeAmount;
    }
    uint256[] memory stakeIndexes = new uint256[](amountToRetrieve);
    uint256[] memory unlockedTimestamps = new uint256[](amountToRetrieve);
    uint256[] memory actualAmounts = new uint256[](amountToRetrieve);
    address[] memory stakedFor = new address[](amountToRetrieve);
    uint256[] memory stakePercentageBasisPoints = new uint256[](amountToRetrieve);

    uint256 retrieved;
    for (uint256 i = stakeContract.personalStakesLastIndex.sub(1).sub(offset); i >= 0; i--) {
      stakeIndexes[retrieved] = i;
      unlockedTimestamps[retrieved] = stakeContract.personalStakes[i].unlockedTimestamp;
      actualAmounts[retrieved] = stakeContract.personalStakes[i].actualAmount;
      stakedFor[retrieved] = stakeContract.personalStakes[i].stakedFor;
      stakePercentageBasisPoints[retrieved] = stakeContract.personalStakes[i]
        .stakePercentageBasisPoints;

      if (++retrieved >= amountToRetrieve) {
        break;
      }
    }

    return (stakeIndexes, unlockedTimestamps, actualAmounts, stakedFor, stakePercentageBasisPoints);
  }

  /**
   * @dev See {IStaking-stake}
   */
  function stake(
    uint8 stakeOptionIndex,
    uint256 amount,
    bytes calldata data
  ) external override validStakeOption(stakeOptionIndex) {
    createStake(
      _msgSender(),
      amount,
      _stakeOptions[_currentStakeOptionArrayIndex][stakeOptionIndex].stakeDuration,
      _stakeOptions[_currentStakeOptionArrayIndex][stakeOptionIndex].stakePercentageBasisPoints,
      data
    );
  }

  /**
   * @dev See {IStaking-stakeFor}
   */
  function stakeFor(
    uint8 stakeOptionIndex,
    address user,
    uint256 amount,
    bytes calldata data
  ) public override validStakeOption(stakeOptionIndex) {
    createStake(
      user,
      amount,
      _stakeOptions[_currentStakeOptionArrayIndex][stakeOptionIndex].stakeDuration,
      _stakeOptions[_currentStakeOptionArrayIndex][stakeOptionIndex].stakePercentageBasisPoints,
      data
    );
  }

  /**
   * @dev See {IStaking-unstake}
   */
  function unstake(uint256 personalStakeIndex, bytes calldata data) external override {
    withdrawStake(personalStakeIndex, data);
  }

  /**
   * @dev See {IStaking-totalStakedFor}
   */
  function totalStakedFor(address user) public override view returns (uint256) {
    return _stakeHolders[user].totalStakedFor;
  }

  /**
   * @dev See {IStaking-totalStaked}
   */
  function totalStaked() external override view returns (uint256) {
    return _stakingToken.balanceOf(address(this));
  }

  /**
   * @dev See {IStaking-token}
   */
  function token() external override view returns (address) {
    return address(_stakingToken);
  }

  /**
   * @dev See {IStaking-supportsHistory}
   *
   * Since we don't implement the optional interface, this always returns false
   */
  function supportsHistory() external override pure returns (bool) {
    return false;
  }

  /**
   * @dev Helper function to create stakes for a given address
   * @param user address The address the stake is being created for
   * @param amount uint256 The number of tokens being staked
   * @param lockInDuration uint256 The duration to lock the tokens for
   * @param data bytes optional data to include in the Stake event
   * @param stakePercentageBasisPoints uint16 stake reward percentage (basis points)
   *
   * Requirements:
   *
   * - `_stakingToken` allowance should be granted to {Staking} contract
   * address in order for the stake creation to be successful.
   */
  function createStake(
    address user,
    uint256 amount,
    uint256 lockInDuration,
    uint16 stakePercentageBasisPoints,
    bytes calldata data
  ) internal {
    require(
      _stakingToken.transferFrom(_msgSender(), address(this), amount),
      "Staking: stake required"
    );

    if (!_stakeHolders[user].exists) {
      _stakeHolders[user].exists = true;
    }

    uint256 unlockedTimestamp = block.timestamp.add(lockInDuration);
    _stakeHolders[user].totalStakedFor = _stakeHolders[user].totalStakedFor.add(amount);
    _stakeHolders[user].personalStakes[_stakeHolders[user].personalStakesLastIndex] = Stake({
      unlockedTimestamp: unlockedTimestamp,
      actualAmount: amount,
      stakedFor: user,
      stakePercentageBasisPoints: stakePercentageBasisPoints
    });

    emit LogStaked(
      user,
      amount,
      _stakeHolders[user].personalStakesLastIndex,
      unlockedTimestamp,
      stakePercentageBasisPoints,
      totalStakedFor(user),
      data
    );
    _stakeHolders[user].personalStakesLastIndex = _stakeHolders[user].personalStakesLastIndex.add(
      1
    );
  }

  /**
   * @dev Helper function to withdraw stakes for the msg.sender
   * @param personalStakeIndex uint256 index of the stake to withdraw in the personalStakes mapping
   * @param data bytes optional data to include in the Unstake event
   *
   * Requirements:
   *
   * - valid personal stake index is passed.
   * - stake should not be already withdrawn.
   * - `_stakingToken` should transfer the stake amount successfully.
   * - `_stakingToken` should {mint} the stake reward successfully
   * if function is called after the stake's `unlockTimestamp`.
   */
  function withdrawStake(uint256 personalStakeIndex, bytes calldata data) internal {
    require(
      personalStakeIndex <= _stakeHolders[_msgSender()].personalStakesLastIndex.sub(1),
      "Staking: passed the wrong personal stake index"
    );

    Stake storage personalStake = _stakeHolders[_msgSender()].personalStakes[personalStakeIndex];

    require(personalStake.actualAmount > 0, "Staking: already withdrawn this stake");

    require(
      _stakingToken.transfer(_msgSender(), personalStake.actualAmount),
      "Staking: unable to withdraw the stake"
    );

    uint256 stakeReward = 0;
    if (personalStake.unlockedTimestamp <= block.timestamp) {
      stakeReward = personalStake.actualAmount.mul(personalStake.stakePercentageBasisPoints).div(
        uint256(10000)
      );
      require(
        _stakingToken.mint(_msgSender(), stakeReward),
        "Staking: unable to mint the stake reward"
      );
    }

    _stakeHolders[personalStake.stakedFor].totalStakedFor = _stakeHolders[personalStake.stakedFor]
      .totalStakedFor
      .sub(personalStake.actualAmount);

    emit LogUnstaked(
      personalStake.stakedFor,
      personalStake.actualAmount,
      personalStakeIndex,
      stakeReward,
      totalStakedFor(personalStake.stakedFor),
      data
    );

    personalStake.actualAmount = 0;
  }

  /**
   * @dev Modifier that checks if passed `stakeOptionIndex` is valid.
   *
   * Requirements:
   *
   * - `_stakeOptions[_currentStakeOptionArrayIndex]` should not be empty,
   * which means there are valid staking options at the moment.
   * - `stakeOptionIndex` should be a valid index of any stake option
   * in `_stakeOptions[_currentStakeOptionArrayIndex]`.
   */
  modifier validStakeOption(uint8 stakeOptionIndex) {
    require(
      _currentStakeOptionArrayIndex > 0 && _stakeOptions[_currentStakeOptionArrayIndex].length > 0,
      "Staking: no available staking options at the moment."
    );
    require(
      stakeOptionIndex < _stakeOptions[_currentStakeOptionArrayIndex].length,
      "Staking: passed a non-valid stake option index."
    );
    _;
  }
}
