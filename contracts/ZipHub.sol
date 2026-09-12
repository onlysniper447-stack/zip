// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// ZIP Hub — Creditcoin testnet ledger behind $handles and receipts.
contract ZipHub {
    address public operator;

    mapping(string => address) public handleTo;
    mapping(address => string) public addressToHandle;
    mapping(address => mapping(bytes32 => uint256)) public poolBal;
    mapping(address => mapping(bytes32 => uint256)) public tokenBal;
    mapping(address => uint256) public debt;

    event Registered(address indexed account, string handle);
    event Paid(address indexed from, address indexed to, uint256 amount, string handle);
    event Deposited(address indexed user, bytes32 indexed pool, uint256 amount);
    event Withdrawn(address indexed user, bytes32 indexed pool, uint256 amount);
    event Swapped(address indexed user, bytes32 fromId, bytes32 toId, uint256 amountIn, uint256 amountOut);
    event Borrowed(address indexed user, uint256 amount);
    event CashedOut(address indexed user, uint256 amount, string dest);
    event Stocked(address indexed user, bytes32 symbol, uint256 amount, bool buying);

    constructor() payable {
        operator = msg.sender;
    }

    receive() external payable {}

    function register(string calldata handle) external {
        bytes memory raw = bytes(handle);
        require(raw.length >= 2 && raw.length <= 24, "handle");
        address current = handleTo[handle];
        require(current == address(0) || current == msg.sender, "taken");
        string memory prev = addressToHandle[msg.sender];
        if (bytes(prev).length != 0 && keccak256(bytes(prev)) != keccak256(raw)) {
            handleTo[prev] = address(0);
        }
        handleTo[handle] = msg.sender;
        addressToHandle[msg.sender] = handle;
        emit Registered(msg.sender, handle);
    }

    function lookup(string calldata handle) external view returns (address) {
        return handleTo[handle];
    }

    function pay(address to, string calldata handle) external payable {
        require(msg.value > 0, "amount");
        address dest = to;
        if (dest == address(0)) dest = handleTo[handle];
        require(dest != address(0), "who");
        (bool ok, ) = payable(dest).call{value: msg.value}("");
        require(ok, "pay");
        emit Paid(msg.sender, dest, msg.value, handle);
    }

    function deposit(bytes32 pool) external payable {
        require(msg.value > 0, "amount");
        poolBal[msg.sender][pool] += msg.value;
        emit Deposited(msg.sender, pool, msg.value);
    }

    function withdraw(bytes32 pool, uint256 amount) external {
        require(amount > 0 && poolBal[msg.sender][pool] >= amount, "bal");
        poolBal[msg.sender][pool] -= amount;
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "send");
        emit Withdrawn(msg.sender, pool, amount);
    }

    function priceUsd(bytes32 id) public pure returns (uint256) {
        if (id == keccak256("cash") || id == keccak256("CTC") || id == keccak256("USDC")) return 1e18;
        if (id == keccak256("g-CRE")) return 118e16;
        if (id == keccak256("ETH")) return 3480e18;
        revert("asset");
    }

    function swap(bytes32 fromId, bytes32 toId, uint256 amountIn) external payable returns (uint256 amountOut) {
        require(fromId != toId && amountIn > 0, "pair");
        bytes32 cash = keccak256("cash");
        uint256 usd;
        if (fromId == cash) {
            require(msg.value == amountIn, "value");
            usd = amountIn;
        } else {
            require(msg.value == 0, "value");
            require(tokenBal[msg.sender][fromId] >= amountIn, "bal");
            tokenBal[msg.sender][fromId] -= amountIn;
            usd = (amountIn * priceUsd(fromId)) / 1e18;
        }
        if (toId == cash) {
            amountOut = usd;
            require(address(this).balance >= amountOut, "liq");
            (bool ok, ) = payable(msg.sender).call{value: amountOut}("");
            require(ok, "send");
        } else {
            amountOut = (usd * 1e18) / priceUsd(toId);
            tokenBal[msg.sender][toId] += amountOut;
        }
        require(amountOut > 0, "out");
        emit Swapped(msg.sender, fromId, toId, amountIn, amountOut);
    }

    function borrow(uint256 amount) external {
        require(amount > 0 && amount <= 100 ether, "amt");
        require(debt[msg.sender] + amount <= 100 ether, "cap");
        require(address(this).balance >= amount, "liq");
        debt[msg.sender] += amount;
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "send");
        emit Borrowed(msg.sender, amount);
    }

    function cashOut(string calldata dest) external payable {
        require(msg.value > 0, "amount");
        emit CashedOut(msg.sender, msg.value, dest);
    }

    function stockTrade(bytes32 symbol, uint256 amount, bool buying) external payable {
        bytes32 key = keccak256(abi.encodePacked("STOCK", symbol));
        if (buying) {
            require(msg.value == amount && amount > 0, "value");
            tokenBal[msg.sender][key] += amount;
        } else {
            require(msg.value == 0 && amount > 0, "value");
            require(tokenBal[msg.sender][key] >= amount, "bal");
            tokenBal[msg.sender][key] -= amount;
            (bool ok, ) = payable(msg.sender).call{value: amount}("");
            require(ok, "send");
        }
        emit Stocked(msg.sender, symbol, amount, buying);
    }
}
