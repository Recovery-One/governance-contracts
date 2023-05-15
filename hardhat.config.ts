import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-contract-sizer";
import 'hardhat-dependency-compiler';

// hardhat.config.js
require('@openzeppelin/hardhat-upgrades');

const accounts = {
  Localnet: [String(process.env.PRIVATE_KEY)],
  Testnet: [String(process.env.PRIVATE_KEY)],
  Mainnet: [String(process.env.PRIVATE_KEY)],
};

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      blockGasLimit: 40000000,
      allowUnlimitedContractSize: true
    },
    testnet: {
      url: 'https://api.s0.b.hmny.io',
      chainId: 1666700000,
      accounts: accounts.Testnet,
    },
    mainnet: {
      url: 'https://harmony-mainnet.chainstacklabs.com/',
      chainId: 1666600000,
      accounts: accounts.Mainnet,
      gasPrice: 100000000000
    },    
  },
  mocha: {
    timeout: 50000,
  },  
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },  
  dependencyCompiler: {
    paths: [
      '@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol',
    ],
  }    
};

export default config;
