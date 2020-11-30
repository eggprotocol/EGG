// SPDX-License-Identifier: Apache license 2.0

pragma solidity ^0.7.0;

import "../interfaces/IBurning.sol";
import "../utils/Context.sol";
import "../token/ERC20Burnable.sol";

/**
 * @dev Implementation of the {IBurning} interface.
 *
 * Provides the configurable rules for burning the passed {ERC20Burnable} token.
 */
contract Burning is IBurning, Context {
  using SafeMathUint for uint256;

  ERC20Burnable _burningToken;

  uint256 private _burnLimit;
  uint256 private _singleBurnAmount;
  uint256 private _burned;

  /**
   * @dev Sets the `burningToken` token that will be burned,
   * `burnLimit` as a total maximum amount of tokens to be burnt and
   * `singleBurnAmount` as a one-time amount to be burned upon each request.
   */
  constructor(
    ERC20Burnable burningToken,
    uint256 burnLimit,
    uint256 singleBurnAmount
  ) {
    _burningToken = burningToken;
    _burnLimit = burnLimit;
    _singleBurnAmount = singleBurnAmount;
  }

  /**
   * @dev See {IBurning-burn}. Attempts to burn the `singleBurnAmount` of `_burningToken`.
   *
   * Requirements:
   *
   * - `sender` should be the `_burningToken`.
   * - `_burnLimit` is not reached yet.
   * - {ERC20Burnable-burn} succeeds.
   */
  function burn() external override returns (bool success) {
    require(_msgSender() == address(_burningToken), "Burning: only token contract can burn tokens");

    uint256 allowedToBurn = _burnLimit.sub(_burned);
    uint256 amountToBurn = _singleBurnAmount;
    uint256 balance = _burningToken.balanceOf(address(this));
    if (amountToBurn > balance) {
      amountToBurn = balance;
    }
    if (amountToBurn > allowedToBurn) {
      amountToBurn = allowedToBurn;
    }

    require(amountToBurn > 0, "Burning: reached the burning limit");
    require(_burningToken.burn(amountToBurn), "Burning: failed to burn tokens");
    _burned = _burned.add(amountToBurn);
    emit LogPeriodicTokenBurn(address(this), amountToBurn);
    return true;
  }

  /**
   * @dev See {IBurning-burned}.
   */
  function burned() external override view returns (uint256) {
    return _burned;
  }

  /**
   * @dev See {IBurning-burnLimit}.
   */
  function burnLimit() external override view returns (uint256) {
    return _burnLimit;
  }

  /**
   * @dev See {IBurning-singleBurnAmount}.
   */
  function singleBurnAmount() external override view returns (uint256) {
    return _singleBurnAmount;
  }
}
