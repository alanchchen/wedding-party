// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "./lib/NativeMetaTransaction.sol";

contract EternalLove is Ownable, NativeMetaTransaction, ERC721 {
    using Counters for Counters.Counter;
    using Strings for uint256;

    Counters.Counter private _tokenIdTracker;

    uint256 constant RING_KINDS = 5;

    string internal constant BASEURI =
        "ipfs://QmVsUm46qMg5J42ingWaHR72ApSdjMCKvwLpeeh7gPTHC7/";

    constructor()
        NativeMetaTransaction("EternalLove", "1")
        ERC721("EternalLove", "ELOVE")
    {}

    function mint(address to)
        public
        virtual
        onlyOwner
        returns (uint256 tokenId)
    {
        tokenId = _tokenIdTracker.current();
        _safeMint(to, tokenId);
        _tokenIdTracker.increment();
    }

    function contractURI() public pure returns (string memory) {
        return "";
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return BASEURI;
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "EternalLove: URI query for nonexistent token"
        );

        string memory baseURI = _baseURI();
        uint256 id = (tokenId % RING_KINDS) + 1;
        return
            bytes(baseURI).length > 0
                ? string(abi.encodePacked(baseURI, id.toString()))
                : "";
    }

    function _msgSender()
        internal
        view
        virtual
        override(Context, NativeMetaTransaction)
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
        override(Context, NativeMetaTransaction)
        returns (bytes calldata)
    {
        if (msg.sender == address(this)) {
            return msg.data[:msg.data.length - 20];
        } else {
            return msg.data;
        }
    }
}
