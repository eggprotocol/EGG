// SPDX-License-Identifier: Apache license 2.0

pragma solidity ^0.7.0;

/**
 * @dev Interface of the smart contract that configures rules
 * and executes burning of the passed {ERC20Burnable} token.
 */
interface IBurning {
  /**
   * @dev Emitted when `value` tokens are burned via `burningContract`.
   */
  event LogPeriodicTokenBurn(address indexed burningContract, uint256 value);

  /**
   * @dev Attempts to burn tokens.
   */
  function burn() external returns (bool);

  /**
   * @dev Returns a total amount of tokens that were already burned.
   */
  function burned() external view returns (uint256);

  /**
   * @dev Returns a total maximum amount of tokens to be burnt.
   */
  function burnLimit() external view returns (uint256);

  /**
   * @dev Returns a one-time amount to be burned upon each request.
   */
  function singleBurnAmount() external view returns (uint256);
}
