// SPDX-License-Identifier: Apache license 2.0

pragma solidity ^0.7.0;

import "../utils/Context.sol";
import "./ERC20Pausable.sol";
import "../libraries/SafeMathUint.sol";

/**
 * @dev Extension of {ERC20} that allows to set up a 'lock-in' period for tokens,
 * which means a percentage of tokens received through from {LockableDistribution} contract
 * will not be transferrable until the end of 'lock-in' period.
 */
abstract contract ERC20Lockable is Context, ERC20Pausable {
  using SafeMathUint for uint256;

  address _lockableDistribution;

  struct BalanceLock {
    uint256 lockedAmount;
    uint256 unlockTimestamp;
  }
  mapping(address => BalanceLock) internal _balanceLocks;

  /**
   * @dev Creates a 'lock-in' period for `lockAmount` tokens on `lockFor` address
   * that lasts until `unlockTimestamp` timestamp.
   */
  function lock(
    address lockFor,
    uint256 lockAmount,
    uint256 unlockTimestamp
  ) external {
    require(
      _msgSender() == _lockableDistribution,
      "ERC20Lockable: only distribution contract can lock tokens"
    );

    _balanceLocks[lockFor].lockedAmount = lockAmount;
    _balanceLocks[lockFor].unlockTimestamp = unlockTimestamp;
  }

  /**
   * @dev Returns a 'lock-in' period details for `account` address.
   */
  function lockOf(address account)
    public
    view
    returns (uint256 lockedAmount, uint256 unlockTimestamp)
  {
    return (_balanceLocks[account].lockedAmount, _balanceLocks[account].unlockTimestamp);
  }

  /**
   * @dev Hook that restricts transfers according to the 'lock-in' period.
   *
   * See {ERC20-_beforeTokenTransfer}.
   *
   * Requirements:
   *
   * - transferred amount should not include tokens that are 'locked-in'.
   */
  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal virtual override {
    super._beforeTokenTransfer(from, to, amount);

    uint256 lockedAmount;
    uint256 unlockTimestamp;
    (lockedAmount, unlockTimestamp) = lockOf(from);
    if (unlockTimestamp != 0 && block.timestamp < unlockTimestamp) {
      require(
        amount <= balanceOf(from).sub(lockedAmount),
        "ERC20Lockable: transfer amount exceeds the non-locked balance"
      );
    }
  }
}
