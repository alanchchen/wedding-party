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

    string internal _baseUri;
    string internal _contractUri;

    constructor(
        address owner,
        string memory name,
        string memory baseUri,
        string memory contractUri
    ) NativeMetaTransaction(name, "1") ERC721(name, "ELOVE") {
        _transferOwnership(owner);
        _tokenIdTracker.increment();
        _baseUri = baseUri;
        _contractUri = contractUri;
    }

    function mint(address to) public virtual onlyOwner {
        _safeMint(to, _tokenIdTracker.current());
        _tokenIdTracker.increment();
    }

    function contractURI() public view virtual returns (string memory) {
        return _contractUri;
    }

    function setContractURI(string memory contractUri) public onlyOwner {
        _contractUri = contractUri;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseUri;
    }

    function setBaseURI(string memory baseUri) public onlyOwner {
        _baseUri = baseUri;
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

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, NativeMetaTransaction)
        returns (bool)
    {
        return
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC721Metadata).interfaceId ||
            interfaceId == type(INativeMetaTransaction).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
