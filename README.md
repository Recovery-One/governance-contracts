# Recovery One Governance Contracts

## Architecture

### Phase 1: Stake/Unstake Depegged Tokens

* Compound based Governance Contract (OpenZeppelin)
* Stake depegged tokens for rONE Governance token.
* Unstake token to exit the rONE.
* Able to cast vote to Governance contract
* Only committee can propose
* Governance retains 2.5% for grantee
* Committee retains 2.5% for compensation

```mermaid
sequenceDiagram
    Users->>rONE (ERC20): Stake(depegged, amount)
    rONE (ERC20)->>Users: Mints rONE
    Users->>rONE (ERC20): Unstake(depegged, amount)
    rONE (ERC20)->>Governance: Mints 2.5% tokens
    rONE (ERC20)->>Committee(Gnosis): Mints 2.5% tokens
    Committee(Gnosis)->>Governance: Propose(transfer(rONE, grantee))
    Users->>Governance: castVote(proposalId, support)
    Governance->>rONE (ERC20): getVotes
    Committee(Gnosis)->>Governance: execute(proposal)
```

### Phase 2: Staking/Unstake rONE

* RecoveryChef receives 750Mil ONE to pay for rewards
* Users can delegateVotes to let another address to vote on their behalf.

```mermaid
sequenceDiagram
    participant Users
    participant RecoveryChef
    participant Harmony

    Harmony->>RecoveryChef: Transfer(750Mil ONE)
    Users->>RecoveryChef: Stake(rONE, amount)
    Users->>RecoveryChef: Unstake(rONE, amount)
    Users->>RecoveryChef: collectReward()
```

### Phase 3: ONE Redemption

* RecoveryRedemption receives 2.5 Bil ONE tokens over 3 year period

```mermaid
sequenceDiagram
    participant Users
    participant RecoveryChef
    participant RecoveryRedemption
    participant Harmony

    Harmony->>RecoveryRedemption: Funds 2.54 Bil tokens over 3 years
    Users->>RecoveryChef: Unstake(rONE, amount) (no penalty)
    Users->>RecoveryRedemption: swapForOne(amount)

```

## How to run
```shell
npx hardhat help
npx hardhat test
GAS_REPORT=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts
```
