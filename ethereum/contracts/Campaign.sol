// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CampaignFactory{
    address[] public deployedCampaign;

    function createCampaign(uint minimumValue) public {
        address newCampaign = address(new Campaign(minimumValue, msg.sender));
        deployedCampaign.push(newCampaign);
    }

    function getDeployedCampaign() public view returns(address[] memory){
        return deployedCampaign;
    }
}

contract Campaign{
    struct Request{
        string description;
        uint value;
        address recipient;
        bool complete;
        uint approvalCount;
        mapping(address => bool) approvals;
    }
    
    uint public minimumContribution;
    uint numRequest;
    address public manager;
    mapping(address => bool) public approvers;
    uint public approversCount;
    mapping(uint => Request) requests;
    
    

    modifier restricted(){
        require(msg.sender == manager);
        _;
    }

    constructor(uint minimumValue, address sender){
        minimumContribution = minimumValue;
        manager = sender;
    }

    function contribute() public payable {
        require(msg.value > minimumContribution);
        approvers[msg.sender]=true;
        approversCount++;
    }

    function createRequest(string memory description, uint value, address recipient) public restricted {
        Request storage request = requests[numRequest++];

        request.description= description;
        request.value=value;
        request.recipient=recipient;
        request.complete=false;
        request.approvalCount=0;

    }

    function approveRequest(uint index)public {
        Request storage request = requests[index];
        require(approvers[msg.sender]);
        require(!request.approvals[msg.sender]);

        request.approvals[msg.sender]=true;
        request.approvalCount++;
    }

    function finaliseRequest(uint index)public restricted{
        Request storage request = requests[index];

        require(!request.complete);
        require(request.approvalCount > (approversCount/2));

        payable(request.recipient).transfer(request.value);

        request.complete=true;
    }
}