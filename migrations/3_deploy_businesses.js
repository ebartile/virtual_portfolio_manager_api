var Businesses = artifacts.require('./Businesses.sol');

module.exports = function(deployer){
    deployer.deploy(Businesses);
}