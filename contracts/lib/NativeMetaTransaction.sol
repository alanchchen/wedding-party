//SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@openzeppelin/contracts/utils/Context.sol";

import "./EIP712.sol";
import "./EIP712Domain.sol";

// Example typed data
//
//     {
//       types: {
//         EIP712Domain: [
//           { name: "name", type: "string" },
//           { name: "version", type: "string" },
//           { name: "chainId", type: "uint256" },
//           { name: "verifyingContract", type: "address" },
//         ],
//         MetaTransaction: [
//           { name: "authorizer", type: "address" },
//           { name: "nonce", type: "bytes32" },
//           { name: "callData", type: "bytes" },
//           { name: "deadline", type: "uint256" },
//         ],
//       },
//       domain: {
//         name: "NativeMetaTransaction",
//         version: "1",
//         chainId: 1,
//         verifyingContract: "0x1111111111111111111111111111111111111111",
//       },
//       primaryType: "MetaTransaction",
//       message: {
//         authorizer: authorizer.address,
//         nonce: ethers.utils.randomBytes(32),
//         callData: "0x....",
//         deadline: Math.floor(Date.now() / 1000) + 3600, // Valid for an hour
//       },
//     }
//
contract NativeMetaTransaction is Context, EIP712Domain {
    bytes32 private constant META_TRANSACTION_TYPEHASH =
        keccak256(
            bytes(
                "MetaTransaction(address authorizer,bytes32 nonce,bytes callData,uint256 deadline)"
            )
        );

    bytes32 private constant CANCEL_META_TRANSACTION_TYPEHASH =
        keccak256(
            bytes("CancelMetaTransaction(address authorizer,bytes32 nonce)")
        );

    event MetaTransactionExecuted(
        address indexed authorizer,
        bytes32 indexed nonce,
        bytes callData
    );
    event MetaTransactionCanceled(
        address indexed authorizer,
        bytes32 indexed nonce
    );

    /**
     * @dev authorizer address => nonce => bool (true if nonce is used)
     */
    mapping(address => mapping(bytes32 => bool)) private _authorizationStates;

    constructor(string memory name, string memory version) {
        DOMAIN_SEPARATOR = EIP712.makeDomainSeparator(name, version);
    }

    function executeMetaTransaction(
        address authorizer,
        bytes32 nonce,
        bytes memory callData,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public payable returns (bytes memory) {
        _requireValidFuntionCall(callData);
        _requireValidAuthorization(
            authorizer,
            nonce,
            callData,
            deadline,
            v,
            r,
            s
        );

        // Append userAddress at the end to extract it from calling context
        (bool success, bytes memory returnData) = address(this).call(
            abi.encodePacked(callData, authorizer)
        );

        require(success, "NativeMetaTransaction: function call not successful");
        _markAuthorizationAsUsed(authorizer, nonce);
        // emit MetaTransactionExecuted(authorizer, nonce, callData);

        return returnData;
    }

    /**
     * @notice Returns the state of an authorization
     * @dev Nonces are randomly generated 32-byte data unique to the
     * authorizer's address
     * @param authorizer    Authorizer's address
     * @param nonce         Nonce of the authorization
     * @return True if the nonce is used
     */
    function authorizationState(address authorizer, bytes32 nonce)
        external
        view
        returns (bool)
    {
        return _authorizationStates[authorizer][nonce];
    }

    /**
     * @notice Check that function call is valid
     * @param callData      The authorized function call
     */
    function _requireValidFuntionCall(bytes memory callData) internal pure {
        if (callData.length == 0) {
            return;
        }

        bytes4 sigHash;
        assembly {
            sigHash := mload(add(callData, 32))
        }

        require(
            sigHash != msg.sig,
            "NativeMetaTransaction: calling executeMetaTransaction is forbidden"
        );
    }

    /**
     * @notice Attempt to cancel an authorization
     * @param authorizer    Authorizer's address
     * @param nonce         Nonce of the authorization
     * @param v             v of the signature
     * @param r             r of the signature
     * @param s             s of the signature
     */
    function _cancelAuthorization(
        address authorizer,
        bytes32 nonce,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal {
        require(
            !_authorizationStates[authorizer][nonce],
            "NativeMetaTransaction: authorization is used or canceled"
        );

        bytes memory data = abi.encode(
            CANCEL_META_TRANSACTION_TYPEHASH,
            authorizer,
            nonce
        );

        require(
            EIP712.recover(DOMAIN_SEPARATOR, v, r, s, data) == authorizer,
            "NativeMetaTransaction: invalid signature"
        );

        _markAuthorizationAsUsed(authorizer, nonce);
        // emit MetaTransactionCanceled(authorizer, nonce);
    }

    /**
     * @notice Check that authorization is valid
     * @param authorizer    Authorizer's address
     * @param nonce         Nonce of the authorization
     * @param callData      The authorized function call
     * @param v             v of the signature
     * @param r             r of the signature
     * @param s             s of the signature
     */
    function _requireValidAuthorization(
        address authorizer,
        bytes32 nonce,
        bytes memory callData,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) private view {
        require(
            block.timestamp <= deadline,
            "NativeMetaTransaction: authorization is expired"
        );

        require(
            !_authorizationStates[authorizer][nonce],
            "NativeMetaTransaction: authorization is used or canceled"
        );

        bytes memory data = abi.encode(
            META_TRANSACTION_TYPEHASH,
            authorizer,
            nonce,
            keccak256(callData),
            deadline
        );

        require(
            EIP712.recover(DOMAIN_SEPARATOR, v, r, s, data) == authorizer,
            "NativeMetaTransaction: invalid signature"
        );
    }

    /**
     * @notice Mark an authorization as used
     * @param authorizer    Authorizer's address
     * @param nonce         Nonce of the authorization
     */
    function _markAuthorizationAsUsed(address authorizer, bytes32 nonce)
        private
    {
        _authorizationStates[authorizer][nonce] = true;
    }

    function _msgSender()
        internal
        view
        virtual
        override
        returns (address sender)
    {
        if (msg.sender == address(this)) {
            bytes memory array = msg.data;
            uint256 index = msg.data.length;
            assembly {
                // Load the 32 bytes word from memory with the address on the lower 20 bytes, and mask those.
                sender := and(
                    mload(add(array, index)),
                    0xffffffffffffffffffffffffffffffffffffffff
                )
            }
        } else {
            sender = msg.sender;
        }
        return sender;
    }

    function _msgData()
        internal
        view
        virtual
        override
        returns (bytes calldata)
    {
        if (msg.sender == address(this)) {
            return msg.data[:msg.data.length - 20];
        } else {
            return msg.data;
        }
    }
}
