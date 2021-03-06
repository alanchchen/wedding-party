//SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

interface INativeMetaTransaction {
    function executeMetaTransaction(
        address relayer,
        address authorizer,
        bytes32 nonce,
        bytes memory callData,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external payable returns (bytes memory);

    function authorizationState(address authorizer, bytes32 nonce)
        external
        view
        returns (bool);
}
