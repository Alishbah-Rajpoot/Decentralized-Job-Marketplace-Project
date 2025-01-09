// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// JobMarket.sol
contract JobMarket {
    struct Job {
        uint256 id;
        address client;
        string title;
        string description;
        uint256 budget;
        uint256 deadline;
        address freelancer;
        bool isCompleted;
        bool isActive;
    }

    struct Proposal {
        uint256 jobId;
        address freelancer;
        string description;
        uint256 bid;
        bool isAccepted;
    }

    struct UserProfile {
        string name;
        string skills;
        uint256 rating;
        uint256 totalRatings;
    }

    mapping(uint256 => Job) public jobs;
    mapping(uint256 => Proposal[]) public jobProposals;
    mapping(address => UserProfile) public userProfiles;
    mapping(uint256 => mapping(address => bool)) public hasProposed;

    uint256 public jobCounter;
    uint256 public constant PLATFORM_FEE = 2; // 2% platform fee

    event JobCreated(uint256 indexed jobId, address indexed client, string title, uint256 budget);
    event ProposalSubmitted(uint256 indexed jobId, address indexed freelancer, uint256 bid);
    event JobAwarded(uint256 indexed jobId, address indexed freelancer, uint256 bid);
    event JobCompleted(uint256 indexed jobId, address indexed freelancer, uint256 amount);
    
    modifier onlyJobClient(uint256 _jobId) {
        require(jobs[_jobId].client == msg.sender, "Not the job client");
        _;
    }

    modifier onlyJobFreelancer(uint256 _jobId) {
        require(jobs[_jobId].freelancer == msg.sender, "Not the job freelancer");
        _;
    }

    modifier jobExists(uint256 _jobId) {
        require(_jobId < jobCounter, "Job does not exist");
        _;
    }

    function createJob(
        string memory _title,
        string memory _description,
        uint256 _deadline
    ) external payable {
        require(msg.value > 0, "Budget must be greater than 0");
        require(_deadline > block.timestamp, "Deadline must be in the future");

        jobs[jobCounter] = Job({
            id: jobCounter,
            client: msg.sender,
            title: _title,
            description: _description,
            budget: msg.value,
            deadline: _deadline,
            freelancer: address(0),
            isCompleted: false,
            isActive: true
        });

        emit JobCreated(jobCounter, msg.sender, _title, msg.value);
        jobCounter++;
    }

    function submitProposal(
        uint256 _jobId,
        string memory _description,
        uint256 _bid
    ) external jobExists(_jobId) {
        Job storage job = jobs[_jobId];
        require(job.isActive, "Job is not active");
        require(!hasProposed[_jobId][msg.sender], "Already proposed");
        require(_bid <= job.budget, "Bid exceeds budget");

        Proposal memory proposal = Proposal({
            jobId: _jobId,
            freelancer: msg.sender,
            description: _description,
            bid: _bid,
            isAccepted: false
        });

        jobProposals[_jobId].push(proposal);
        hasProposed[_jobId][msg.sender] = true;

        emit ProposalSubmitted(_jobId, msg.sender, _bid);
    }

    function awardJob(
        uint256 _jobId,
        address _freelancer
    ) external jobExists(_jobId) onlyJobClient(_jobId) {
        Job storage job = jobs[_jobId];
        require(job.isActive, "Job is not active");
        require(job.freelancer == address(0), "Job already awarded");
        require(hasProposed[_jobId][_freelancer], "Freelancer has not proposed");

        job.freelancer = _freelancer;
        job.isActive = false;

        // Find the accepted proposal's bid
        Proposal[] storage proposals = jobProposals[_jobId];
        uint256 acceptedBid;
        for (uint i = 0; i < proposals.length; i++) {
            if (proposals[i].freelancer == _freelancer) {
                proposals[i].isAccepted = true;
                acceptedBid = proposals[i].bid;
                break;
            }
        }

        emit JobAwarded(_jobId, _freelancer, acceptedBid);
    }

    function completeJob(
        uint256 _jobId
    ) external jobExists(_jobId) onlyJobClient(_jobId) {
        Job storage job = jobs[_jobId];
        require(!job.isCompleted, "Job already completed");
        require(job.freelancer != address(0), "Job not awarded");

        job.isCompleted = true;

        // Calculate platform fee
        uint256 platformFee = (job.budget * PLATFORM_FEE) / 100;
        uint256 freelancerPayment = job.budget - platformFee;

        // Transfer payments
        (bool success, ) = job.freelancer.call{value: freelancerPayment}("");
        require(success, "Payment failed");

        emit JobCompleted(_jobId, job.freelancer, freelancerPayment);
    }

    function updateUserProfile(
        string memory _name,
        string memory _skills
    ) external {
        UserProfile storage profile = userProfiles[msg.sender];
        profile.name = _name;
        profile.skills = _skills;
    }

    function rateUser(address _user, uint256 _rating) external {
        require(_rating >= 1 && _rating <= 5, "Rating must be between 1 and 5");
        UserProfile storage profile = userProfiles[_user];
        profile.rating = ((profile.rating * profile.totalRatings) + _rating) / (profile.totalRatings + 1);
        profile.totalRatings++;
    }

    // View functions
    function getJob(uint256 _jobId) external view returns (Job memory) {
        return jobs[_jobId];
    }

    function getJobProposals(uint256 _jobId) external view returns (Proposal[] memory) {
        return jobProposals[_jobId];
    }

    function getUserProfile(address _user) external view returns (UserProfile memory) {
        return userProfiles[_user];
    }
}