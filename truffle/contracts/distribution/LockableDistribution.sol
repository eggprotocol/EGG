// SPDX-License-Identifier: Apache license 2.0

pragma solidity ^0.7.0;

import "../utils/Context.sol";
import "../utils/Ownable.sol";
import "../token/ERC20Lockable.sol";
import "../libraries/SafeMathUint.sol";

/**
 * @dev Distributes the tokens and triggers the `lock-in` period for them.
 *
 * See {ERC20Lockable}.
 */
contract LockableDistribution is Context, Ownable {
  using SafeMathUint for uint256;

  ERC20Lockable _lockableToken;

  uint16 private constant LOCK_PERCENTAGE_BASIS_POINTS = 8000;
  uint32 private constant LOCK_DURATION = 7776000;

  /**
   * @dev Sets the `lockableToken` token which will be distibuted through
   * {LockableDistribution} and which will have a `lock-in` period.
   */
  constructor(ERC20Lockable lockableToken) {
    _lockableToken = lockableToken;
  }

  /**
   * @dev Distributes `value` tokens to `to` and locks the
   * `LOCK_PERCENTAGE_BASIS_POINTS` of them for `LOCK_DURATION` seconds.
   */
  function distributeAndLock(address to, uint256 value) external returns (bool) {
    _lockableToken.lock(
      to,
      value.mul(LOCK_PERCENTAGE_BASIS_POINTS).div(uint256(10000)),
      block.timestamp + LOCK_DURATION
    );
    _lockableToken.transferFrom(_msgSender(), to, value);
  }

  /**
   * @dev Distributes each of `values` tokens to each of `to` and locks the
   * `LOCK_PERCENTAGE_BASIS_POINTS` of them for `LOCK_DURATION` seconds.
   */
  function distributeAndLockBatch(address[] calldata to, uint256[] calldata values)
    external
    returns (bool)
  {
    require(
      to.length == values.length && to.length > 0,
      "LockableDistribution: to and values arrays should be equal in size and non-empty"
    );

    uint256 i = 0;
    while (i < to.length) {
      _lockableToken.lock(
        to[i],
        values[i].mul(LOCK_PERCENTAGE_BASIS_POINTS).div(uint256(10000)),
        block.timestamp + LOCK_DURATION
      );
      _lockableToken.transferFrom(_msgSender(), to[i], values[i]);
      i++;
    }
  }

  /**
   * @dev Returns the percentage (basis points) of tokens that are `locked-in` upon each distribution.
   */
  function lockPercentageBasisPoints() external pure returns (uint16) {
    return LOCK_PERCENTAGE_BASIS_POINTS;
  }

  /**
   * @dev Returns the `lock-in` duration in seconds.
   */
  function lockDuration() external pure returns (uint32) {
    return LOCK_DURATION;
  }
}
