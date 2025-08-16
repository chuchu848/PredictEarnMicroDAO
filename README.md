# Predict-to-Earn MicroDAO

A decentralized prediction market smart contract built on the Stacks blockchain using Clarity. Users can create binary predictions, vote on outcomes, and build reputation through accurate forecasting.

##  Overview

The EarnPool contract enables a community-driven prediction market where participants can:
- Create binary (yes/no) predictions with time-based expiration
- Vote on active predictions
- Build reputation through participation and accuracy
- Track performance metrics and engagement scores

##  Contract Architecture

### Data Structures

- **Predictions**: Stores prediction questions, end blocks, and creators
- **Votes**: Records user votes on predictions (one vote per user per prediction)
- **User Stats**: Tracks participation metrics and accuracy scores

### Key Features

- ✅ Time-based prediction expiration
- ✅ One vote per user per prediction
- ✅ Reputation system based on participation and accuracy
- ✅ Event logging for off-chain indexing
- ✅ Comprehensive error handling

## 📋 Functions

### Public Functions (State-Changing)

#### `create-prediction`
Creates a new binary prediction.

```clarity
(create-prediction (question (string-utf8 128)) (end-block uint))
```

**Parameters:**
- `question`: Prediction question (1-128 characters)
- `end-block`: Block height when voting ends (must be future block)

**Returns:** Prediction ID

**Example:**
```clarity
(contract-call? .EarnPool create-prediction "Will Bitcoin reach $100k by end of 2024?" u1000000)
```

#### `vote`
Cast a vote on an active prediction.

```clarity
(vote (prediction-id uint) (choice bool))
```

**Parameters:**
- `prediction-id`: ID of the prediction to vote on
- `choice`: Vote choice (true or false)

**Returns:** Success message

**Example:**
```clarity
(contract-call? .EarnPool vote u1 true)
```

#### `update-correct-prediction`
Updates user's correct prediction count (typically called by oracle).

```clarity
(update-correct-prediction (user principal))
```

### Read-Only Functions (View Functions)

#### Prediction Queries
- `get-prediction(id)`: Get prediction details
- `get-prediction-count()`: Total number of predictions
- `is-prediction-active(id)`: Check if prediction accepts votes
- `get-prediction-status(id)`: Get prediction status ("active"/"ended"/"not-found")

#### Vote Queries
- `get-vote(prediction-id, voter)`: Get user's vote on prediction
- `has-user-voted(user, prediction-id)`: Check if user has voted

#### User Analytics
- `get-user-stats(user)`: Get user's participation statistics
- `get-user-participation-score(user)`: Calculate engagement score
- `get-user-accuracy-rate(user)`: Calculate prediction accuracy percentage

## 🚀 Usage Examples

### Creating a Prediction
```clarity
;; Create a prediction that expires at block 1000000
(contract-call? .EarnPool create-prediction 
  "Will the next Stacks upgrade activate successfully?" 
  u1000000)
```

### Voting on a Prediction
```clarity
;; Vote "true" on prediction #1
(contract-call? .EarnPool vote u1 true)
```

### Checking Prediction Status
```clarity
;; Check if prediction #1 is still active
(contract-call? .EarnPool is-prediction-active u1)

;; Get full prediction details
(contract-call? .EarnPool get-prediction u1)
```

### Viewing User Stats
```clarity
;; Get user's participation statistics
(contract-call? .EarnPool get-user-stats 'SP1234567890ABCDEF)

;; Get user's accuracy rate
(contract-call? .EarnPool get-user-accuracy-rate 'SP1234567890ABCDEF)
```

### Local Development
```bash
# Clone the repository
git clone <repository-url>
cd PredictEarnMicroDAO

# Check contract syntax
clarinet check

# Run tests
clarinet test

# Start local development environment
clarinet integrate
```

### Testnet Deployment
```bash
# Deploy to testnet
clarinet deploy --testnet
```

### Mainnet Deployment
```bash
# Deploy to mainnet (ensure sufficient STX for deployment)
clarinet deploy --mainnet
```

##  Reputation System

The contract implements a dual-metric reputation system:

### Participation Score
```
Participation Score = Predictions Created + Votes Cast
```

### Accuracy Rate
```
Accuracy Rate = (Correct Predictions / Total Votes Cast) × 100
```

This incentivizes both active participation and thoughtful, accurate predictions.

##  Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| 101 | `ERR-NOT-FOUND` | Prediction doesn't exist |
| 102 | `ERR-PREDICTION-ENDED` | Voting period has ended |
| 103 | `ERR-INVALID-END-BLOCK` | End block must be in the future |
| 104 | `ERR-QUESTION-TOO-SHORT` | Question cannot be empty |

##  Workflow

1. **Create**: User creates a prediction with expiration block
2. **Vote**: Community votes on active predictions
3. **Resolve**: External oracle determines correct outcome
4. **Update**: Correct voters get reputation boost
5. **Analyze**: Users track their performance metrics

##  Use Cases

- **Community Governance**: Predict proposal outcomes
- **Market Forecasting**: Economic and crypto predictions
- **Event Betting**: Sports, entertainment, and news events
- **Research**: Crowd-sourced forecasting for decision making





---

**Built with ❤️ on Stacks blockchain**
