const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    try {
        const [deployer] = await ethers.getSigners();
        console.log("Deploying contracts with the account:", deployer.address);
        
        // Display deployer balance
        const balance = await deployer.provider.getBalance(deployer.address);
        console.log("Account balance:", ethers.formatEther(balance), "ETH");

        // Get the JobMarket contract factory
        console.log("Deploying JobMarket contract...");
        const JobMarket = await ethers.getContractFactory("JobMarket");
        const jobMarket = await JobMarket.deploy();

        // Wait for deployment to complete
        await jobMarket.waitForDeployment();
        const jobMarketAddress = await jobMarket.getAddress();

        console.log("\nDeployment Successful!");
        console.log("===================");
        console.log("JobMarket deployed to:", jobMarketAddress);
        console.log("Transaction hash:", jobMarket.deploymentTransaction().hash);
        
        // Verify deployment
        console.log("\nVerifying contract on blockchain explorer...");
        
        // Wait for a few block confirmations
        console.log("Waiting for block confirmations...");
        await jobMarket.deploymentTransaction().wait(5); // Wait for 5 blocks

        // Try to verify on Etherscan if not on local network
        if (network.name !== "hardhat" && network.name !== "localhost") {
            try {
                await hre.run("verify:verify", {
                    address: jobMarketAddress,
                    constructorArguments: [],
                });
                console.log("Contract verified on blockchain explorer!");
            } catch (error) {
                console.log("Verification failed:", error.message);
            }
        }

        // Log deployment details to a file
        const fs = require("fs");
        const deploymentInfo = {
            contractAddress: jobMarketAddress,
            deployerAddress: deployer.address,
            deploymentHash: jobMarket.deploymentTransaction().hash,
            timestamp: new Date().toISOString(),
            network: network.name
        };

        fs.writeFileSync(
            "deployment-info.json",
            JSON.stringify(deploymentInfo, null, 2)
        );

        console.log("\nDeployment info saved to deployment-info.json");
        console.log("\nDeployment complete! You can now interact with the contract.");

    } catch (error) {
        console.error("\nError during deployment:");
        console.error(error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });