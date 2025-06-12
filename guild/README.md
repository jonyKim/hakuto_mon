# Guild SDK Integration

This project is responsible for integrating the Guild SDK to update the allowlist of NFT holders who are staking their NFTs.

## Project Structure

- `src/`: Contains the main code for the Guild SDK integration.
- `config/`: Configuration files for API keys and environment variables.
- `scripts/`: Scripts for periodic tasks, such as updating the allowlist.

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `config/` directory.

3. Run the integration:
   ```bash
   npm start
   ```

## Additional Information

- This project is separate from the main backend API and frontend admin site.
- It uses the Guild SDK to manage the allowlist for staked NFTs. 