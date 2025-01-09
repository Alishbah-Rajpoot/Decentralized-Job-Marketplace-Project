require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/InR6QE9UbummkQ-DWwlFKJNp3A9DtfGW",
      accounts: [
        "266328efd26f64c47c8d5a50649a6220d4d65403025032cc43fde1b795c01e01"
      ],
      chainId: 11155111
    }
  },
  defaultNetwork: "sepolia"
};