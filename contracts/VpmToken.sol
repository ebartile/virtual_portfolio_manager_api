//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ERC.sol";

contract VpmToken is ERC{
    constructor() ERC("VpmToken","VPM"){
        _mint(msg.sender, 1000000000000);
    }

    function decimals() public view virtual override returns (uint8){
        return 0;
    }
}