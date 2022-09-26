// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

// Business - A business that is created by a Creative ( OP - Original Posters ) on Vpm to raise funding

// Angel - Angels are the users/investors who buy equity in exchange of VPM - VpmToken

// Col - Collaborator who collaborates in a business in exchange of VPM

contract Businesses {
    
    // m => (business_address => m (angel_address => investment_amount)) 
    mapping(address => mapping(address => uint)) public funding;
    
    
    mapping(address => BusinessDetails) public businesses;
    
    
    // Struct to save collaborator details
    
    struct CollaboratorsList {
        address colAddress;
        uint amount;
        string position;
    }
    
    
    // Business details struct
    
    struct BusinessDetails{
        bool businessExists;
        uint fundingRaised;
        address[] angelList;
        CollaboratorsList[] colList;
        uint target;
        uint equity;
        bool targetReached;
    }
    
    
    
    
    // Create a new business on Vpm
    
    function createBusiness(address _business, uint _target, uint _equity) public {
        require(businesses[_business].businessExists == false,"Business already exists");
        businesses[_business].businessExists = true;
        businesses[_business].target = _target;
        businesses[_business].equity = _equity;
        businesses[_business].targetReached = false;
    }
    
    
    // Emit event when the business target is reached
    
    event targetReachedForBusiness(address _business);
    
    
    // Buying equity in the business
    
    function buyEquity(address _angel,address _business,uint _amount) public {
        require(businesses[_business].businessExists == true && businesses[_business].targetReached == false,'Business not found');
        if(businesses[_business].fundingRaised + _amount >= businesses[_business].target){
            businesses[_business].targetReached = true;
        }
        funding[_business][_angel] = funding[_business][_angel] + _amount;
        businesses[_business].fundingRaised = businesses[_business].fundingRaised + _amount;
        businesses[_business].angelList.push(_angel);
        

        if(businesses[_business].targetReached){
            emit targetReachedForBusiness( _business);
        }
        
    }
    

    // get the total number of Angels who bought equity in a business 
    // can also be used for fetching the total number of investments
    
    function getAngelListLength(address _business) public view returns(uint){
        return businesses[_business].angelList.length;
    }
    
    
     // get the list of Angels who bought equity in a business 
    
    function getAngelList(address _business) public view returns(address[] memory){
        return businesses[_business].angelList;
    }
    
    
    // Collaborate in a business
    
    function collab(address _col,address _business,string memory _position,uint _amount) public {
        require(businesses[_business].businessExists == true,'Business not found');
        businesses[_business].colList.push(CollaboratorsList({
            colAddress : _col,
            amount : _amount,
            position : _position
        }));
    }
    
    
    // Get collab details for a business
    
    function getCollabDetails(address _business) public view returns (CollaboratorsList[] memory){
        return businesses[_business].colList;
    }
    
}
