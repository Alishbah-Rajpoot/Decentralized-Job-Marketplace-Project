const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("JobMarket", function () {
    let jobMarket;
    let owner;
    let client;
    let freelancer;
    let addrs;

    beforeEach(async function () {
        // Get signers
        [owner, client, freelancer, ...addrs] = await ethers.getSigners();

        // Deploy contract - updated syntax
        const JobMarket = await ethers.getContractFactory("JobMarket");
        jobMarket = await JobMarket.deploy();
        // No need to call deployed() anymore
    });

    describe("Job Creation", function () {
        it("Should create a new job", async function () {
            const budget = ethers.parseEther("1"); // Updated from utils.parseEther
            const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now

            await expect(jobMarket.connect(client).createJob(
                "Test Job",
                "Test Description",
                deadline,
                { value: budget }
            ))
                .to.emit(jobMarket, "JobCreated")
                .withArgs(0, client.address, "Test Job", budget);

            const job = await jobMarket.getJob(0);
            expect(job.client).to.equal(client.address);
            expect(job.budget).to.equal(budget);
            expect(job.isActive).to.equal(true);
        });
    });

    describe("Proposal Submission", function () {
        beforeEach(async function () {
            const budget = ethers.parseEther("1");
            const deadline = Math.floor(Date.now() / 1000) + 86400;
            await jobMarket.connect(client).createJob(
                "Test Job",
                "Test Description",
                deadline,
                { value: budget }
            );
        });

        it("Should submit a proposal", async function () {
            const bid = ethers.parseEther("0.8");
            await expect(jobMarket.connect(freelancer).submitProposal(
                0,
                "Proposal Description",
                bid
            ))
                .to.emit(jobMarket, "ProposalSubmitted")
                .withArgs(0, freelancer.address, bid);

            const proposals = await jobMarket.getJobProposals(0);
            expect(proposals[0].freelancer).to.equal(freelancer.address);
            expect(proposals[0].bid).to.equal(bid);
        });
    });

    describe("Job Award and Completion", function () {
        beforeEach(async function () {
            const budget = ethers.parseEther("1");
            const deadline = Math.floor(Date.now() / 1000) + 86400;
            await jobMarket.connect(client).createJob(
                "Test Job",
                "Test Description",
                deadline,
                { value: budget }
            );
            await jobMarket.connect(freelancer).submitProposal(
                0,
                "Proposal Description",
                ethers.parseEther("0.8")
            );
        });

        it("Should award job to freelancer", async function () {
            await expect(jobMarket.connect(client).awardJob(0, freelancer.address))
                .to.emit(jobMarket, "JobAwarded")
                .withArgs(0, freelancer.address, ethers.parseEther("0.8"));

            const job = await jobMarket.getJob(0);
            expect(job.freelancer).to.equal(freelancer.address);
            expect(job.isActive).to.equal(false);
        });

        it("Should complete job and transfer payment", async function () {
            await jobMarket.connect(client).awardJob(0, freelancer.address);
            
            const initialBalance = await ethers.provider.getBalance(freelancer.address);
            await jobMarket.connect(client).completeJob(0);
            
            const job = await jobMarket.getJob(0);
            expect(job.isCompleted).to.equal(true);

            const finalBalance = await ethers.provider.getBalance(freelancer.address);
            const expectedPayment = ethers.parseEther("0.98"); // 2% platform fee
            
            // Allow for some gas costs in comparison
            expect(finalBalance - initialBalance).to.be.closeTo(
                expectedPayment,
                ethers.parseEther("0.01")
            );
        });
    });

    describe("User Profiles and Ratings", function () {
        it("Should update user profile", async function () {
            await jobMarket.connect(freelancer).updateUserProfile(
                "John Doe",
                "Solidity, JavaScript"
            );

            const profile = await jobMarket.getUserProfile(freelancer.address);
            expect(profile.name).to.equal("John Doe");
            expect(profile.skills).to.equal("Solidity, JavaScript");
        });

        it("Should rate user", async function () {
            await jobMarket.connect(client).rateUser(freelancer.address, 5);
            
            const profile = await jobMarket.getUserProfile(freelancer.address);
            expect(profile.rating).to.equal(5);
            expect(profile.totalRatings).to.equal(1);
        });
    });
});