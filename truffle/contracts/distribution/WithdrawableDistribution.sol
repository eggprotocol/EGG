// SPDX-License-Identifier: Apache license 2.0

pragma solidity ^0.7.0;

import "../utils/Context.sol";
import "../utils/Ownable.sol";
import "../token/ERC20Lockable.sol";
import "../libraries/SafeMathUint.sol";

/**
 * @dev Allows users to withdraw both the unlocked and locked tokens, triggers the `lock-in` period for locked ones.
 *
 * See {ERC20Lockable}.
 */
contract WithdrawableDistribution is Context, Ownable {
  using SafeMathUint for uint256;

  ERC20Lockable _lockableToken;
  uint32 private constant LOCK_DURATION = 7776000;

  mapping(address => uint256) internal _unlockedWithdrawalLimits;
  mapping(address => uint256) internal _lockedWithdrawalLimits;
  
  /**
   * @dev Sets the `lockableToken` token which will be distributed through
   * {WithdrawableDistribution} and which might have a `lock-in` period for lockable withdrawals.
   */
  constructor(ERC20Lockable lockableToken) {
    _lockableToken = lockableToken;
  }

  /**
   * @dev Makes each of 'to' accounts eligible to receive the corresponding 'values' amount of unlocked tokens.
   */
  function increaseUnlockedWithdrawalLimits(address[] calldata to, uint256[] calldata values)
    external onlyOwner
  {
    require(
      to.length == values.length && to.length > 0,
      "WithdrawableDistribution: to and values arrays should be equal in size and non-empty"
    );

    uint256 i = 0;
    while (i < to.length) {
      _unlockedWithdrawalLimits[to[i]] = _unlockedWithdrawalLimits[to[i]].add(values[i]);
      i++;
    }
  }

  /**
   * @dev Makes each of 'to' accounts eligible to receive the corresponding 'values' amount of locked tokens.
   */
  function increaseLockedWithdrawalLimits(address[] calldata to, uint256[] calldata values)
    external onlyOwner
  {
    require(
      to.length == values.length && to.length > 0,
      "WithdrawableDistribution: to and values arrays should be equal in size and non-empty"
    );

    uint256 i = 0;
    while (i < to.length) {
      _lockedWithdrawalLimits[to[i]] = _lockedWithdrawalLimits[to[i]].add(values[i]);
      i++;
    }
  }

  /**
   * @dev Sends unlocked tokens to sender account if eligible.
   */
  function withdrawUnlocked()
    external
  {
    uint256 unlockedTokens = _unlockedWithdrawalLimits[_msgSender()];
    require(
      unlockedTokens > 0,
      "WithdrawableDistribution: your wallet address is not eligible to receive the unlocked tokens"
    );
    require(
      _lockableToken.balanceOf(address(this)) >= unlockedTokens,
      "WithdrawableDistribution: not enough tokens left for distribution, please contact the contract owner organization"
    );

    _unlockedWithdrawalLimits[_msgSender()] = 0;
    _lockableToken.transfer(_msgSender(), unlockedTokens);
  }

  /**
   * @dev Sends locked tokens to sender account if eligible, triggers the `lock-in` period.
   */
  function withdrawLocked()
    external
  {
    uint256 lockedTokens = _lockedWithdrawalLimits[_msgSender()];
    require(
      lockedTokens > 0,
      "WithdrawableDistribution: your wallet address is not eligible to receive the locked tokens"
    );
    require(
      _lockableToken.balanceOf(address(this)) >= lockedTokens,
      "WithdrawableDistribution: not enough tokens left for distribution, please contact the contract owner organization"
    );

    _lockedWithdrawalLimits[_msgSender()] = 0;
    _lockableToken.lock(
      _msgSender(),
      lockedTokens,
      block.timestamp + LOCK_DURATION
    );
    _lockableToken.transfer(_msgSender(), lockedTokens);
  }

  /**
   * @dev Returns the amount of unlocked tokens available for a withdrawal by `user` account.
   */
  function unlockedWithdrawalLimit(address user) public view returns (uint256) {
    return _unlockedWithdrawalLimits[user];
  }

  /**
   * @dev Returns the amount of locked tokens available for a withdrawal by `user` account.
   */
  function lockedWithdrawalLimit(address user) public view returns (uint256) {
    return _lockedWithdrawalLimits[user];
  }

  /**
   * @dev Returns the `lock-in` duration in seconds.
   */
  function lockDuration() external pure returns (uint32) {
    return LOCK_DURATION;
  }
}
