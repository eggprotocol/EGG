// SPDX-License-Identifier: Apache license 2.0

pragma solidity ^0.7.0;

import "./ERC20Pausable.sol";
import "./ERC20Burnable.sol";
import "./ERC20Mintable.sol";
import "./ERC20Lockable.sol";
import "../interfaces/IBurning.sol";
import "../interfaces/IStaking.sol";
import "../libraries/SafeMathUint.sol";

/**
 * @dev EggToken is a {ERC20} implementation with various extensions
 * and custom functionality.
 */
contract EggToken is ERC20Burnable, ERC20Mintable, ERC20Pausable, ERC20Lockable {
  using SafeMathUint for uint256;

  IBurning _burning;
  IStaking _staking;

  /**
   * @dev Sets the values for {name} and {symbol}, allocates the `initialTotalSupply`.
   */
  constructor(
    string memory name,
    string memory symbol,
    uint256 initialTotalSupply
  ) ERC20(name, symbol) {
    _totalSupply = initialTotalSupply;
    _balances[_msgSender()] = _balances[_msgSender()].add(_totalSupply);
    emit Transfer(address(0), _msgSender(), _totalSupply);
  }

  /**
   * @dev Enables the burning, allocates the `burningBalance` to {IBurning} contract.
   */
  function setBurningContract(IBurning burning, uint256 burningBalance) external onlyOwner {
    _burning = burning;

    _totalSupply = _totalSupply.add(burningBalance);
    _balances[address(burning)] = _balances[address(burning)].add(burningBalance);
    emit Transfer(address(0), address(burning), burningBalance);
  }

  /**
   * @dev Enables the staking via {IStaking} contract.
   */
  function setStakingContract(IStaking staking) external onlyOwner {
    _staking = staking;
  }

  /**
   * @dev Enables the token distribution with 'lock-in' period via {LockableDistribution} contract.
   *
   * See {ERC20Lockable}.
   */
  function setLockableDistributionContract(address lockableDistribution) external onlyOwner {
    _lockableDistribution = lockableDistribution;
  }

  /**
   * @dev Moves each of `values` in tokens from the caller's account to the list of `to`.
   *
   * Returns a boolean value indicating whether the operation succeeded.
   *
   * Emits a {Transfer} event per each transfer.
   */
  function transferBatch(address[] calldata to, uint256[] calldata values) external returns (bool) {
    require(
      to.length == values.length && to.length > 0,
      "EggToken: to and values arrays should be equal in size and non-empty"
    );

    uint256 i = 0;
    while (i < to.length) {
      require(to[i] != address(0), "EggToken: transfer to the zero address");

      _beforeTokenTransfer(_msgSender(), to[i], values[i]);

      _balances[_msgSender()] = _balances[_msgSender()].sub(
        values[i],
        "EggToken: transfer amount exceeds balance"
      );
      _balances[to[i]] = _balances[to[i]].add(values[i]);
      emit Transfer(_msgSender(), to[i], values[i]);
      i++;
    }

    return true;
  }

  /**
   * @dev Triggers token burn through the {IBurning} `_burning` contract.
   *
   * Requirements:
   *
   * - only contract owner can trigger the burning.
   */
  function periodicBurn() external onlyOwner returns (bool success) {
    require(_burning.burn(), "Burning: not possible to perform the periodic token burn");

    return true;
  }

  /**
   * @dev Enables withdrawal of {ERC20} tokens accidentally sent to this smart contract.
   *
   * Requirements:
   *
   * - only contract owner can transfer out {ERC20} tokens.
   */
  function transferAnyERC20Token(address tokenAddress, uint256 tokens)
    external
    onlyOwner
    returns (bool success)
  {
    return IERC20(tokenAddress).transfer(_msgSender(), tokens);
  }

  /**
   * @dev See {ERC20-_beforeTokenTransfer},
   * {ERC20Pausable-_beforeTokenTransfer}, {ERC20Lockable-_beforeTokenTransfer}.
   */
  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal virtual override(ERC20, ERC20Pausable, ERC20Lockable) {
    super._beforeTokenTransfer(from, to, amount);
  }

  /**
   * @dev Restricts token minting.
   *
   * Requirements:
   *
   * - only {IStaking} `_staking` contract can mint tokens (staking rewards).
   */
  function _beforeMint() internal virtual override {
    require(_msgSender() == address(_staking), "Staking: only staking contract can mint tokens");
  }
}
