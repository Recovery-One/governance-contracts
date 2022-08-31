import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-contract-sizer";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      blockGasLimit: 40000000,
      allowUnlimitedContractSize: true
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
};

export default config;
