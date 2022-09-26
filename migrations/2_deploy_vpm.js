var VpmToken = artifacts.require("./VpmToken.sol");

module.exports = function(deployer){
    deployer.deploy(VpmToken);
}