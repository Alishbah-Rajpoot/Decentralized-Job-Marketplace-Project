// JobMarketModule.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const JobMarketModule = buildModule("JobMarketModule", (m) => {
    // Deploy the JobMarket contract
    const jobMarket = m.contract("JobMarket");

    // Additional configuration can be added here
    // For example, if we need to set up initial parameters or call functions after deployment

    // Return the deployed contract
    return { jobMarket };
});

export default JobMarketModule;