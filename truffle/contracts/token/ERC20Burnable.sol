// SPDX-License-Identifier: Apache license 2.0

pragma solidity ^0.7.0;

import "../utils/Context.sol";
import "./ERC20.sol";
import "../libraries/SafeMathUint.sol";

/**
 * @dev Extension of {ERC20} that allows token holders to destroy both their own
 * tokens and those that they have an allowance for, in a way that can be
 * recognized off-chain (via event analysis).
 */
abstract contract ERC20Burnable is Context, ERC20 {
  using SafeMathUint for uint256;

  /**
   * @dev Destroys `amount` tokens from the caller.
   *
   * See {ERC20-_burn}.
   */
  function burn(uint256 amount) external virtual returns (bool success) {
    _burn(_msgSender(), amount);
    return true;
  }

  /**
   * @dev Destroys `amount` tokens from `account`, deducting from the caller's
   * allowance.
   *
   * See {ERC20-_burn} and {ERC20-allowance}.
   *
   * Requirements:
   *
   * - the caller must have allowance for `accounts`'s tokens of at least
   * `amount`.
   */
  function burnFrom(address account, uint256 amount) external virtual returns (bool success) {
    uint256 decreasedAllowance = allowance(account, _msgSender()).sub(
      amount,
      "ERC20Burnable: burn amount exceeds allowance"
    );
    _approve(account, _msgSender(), decreasedAllowance);
    _burn(account, amount);
    return true;
  }
}
