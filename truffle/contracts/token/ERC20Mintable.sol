// SPDX-License-Identifier: Apache license 2.0

pragma solidity ^0.7.0;

import "../utils/Context.sol";
import "./ERC20.sol";

/**
 * @dev Extension of {ERC20} that allows new tokens to be created,
 * in a way that can be recognized off-chain (via event analysis).
 */
abstract contract ERC20Mintable is Context, ERC20 {
  /**
   * @dev Creates `amount` tokens for `account`.
   *
   * See {ERC20-_mint}.
   */
  function mint(address account, uint256 amount) external virtual returns (bool success) {
    _mint(account, amount);
    return true;
  }
}
