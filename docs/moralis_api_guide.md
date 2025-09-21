참고 URL https://docs.moralis.com/web3-data-api/evm

Web3 Data API
What are the Web3 Data APIs?
The Moralis Web3 Data APIs are a set of highly scalable APIs that solve popular Web3 challenges. By indexing blockchain data in a structured way, Moralis is able to expose APIs that make querying, fetching and understanding this data a breeze for developers.

Web3 Data API Features
Moralis indexes all core aspects of blockchain data and provides access to this through a suite of data-focussed API endpoints. No matter what you are building, our Web3 Data API will support the data you will need; including Blocks, Transactions, NFTs, Tokens and Balance information.

NFT Data: Fetch real-time NFT metadata, ownership data, NFT transfer data, NFT prices, and much more.
Token Data: Seamlessly access real-time token price, ownership and transfer data.
Transaction Data: Get detailed information for any user transaction. List past transactions, and stay up to date with your user's on-chain activity.
Block Data: Get the contents of any block, including transactions, internal transactions, events and logs.
Event & Log Data: Granular logs and events for specific wallets and contracts.
DeFi Data: Out-of-the-box liquidity reserves and pair data across multiple blockchains.
Use Cases
Our advanced feature set of Web3 Data APIs are best for those that are building crypto fintech applications, which includes:

Wallet App
Portfolio Trackers
Block Explorers
Audit & Reporting
NFT Marketplace
etc.

Support Chain
Ethereum Mainnet, Ethereum Sepolia, Ethereum Holesky, Polygon Mainnet, Polygon Amoy, Binance Smart Chain Mainnet, Binance Smart Chain Testnet, ETC

Moralis Web3 API 개요
Moralis는 고성능 Web3 Data API를 제공하는 플랫폼으로, EVM 기반 여러 체인에서 블록, 트랜잭션, NFT, 토큰, 컨트랙트 및 로그 등 다양한 데이터를 쉽고 빠르게 조회할 수 있도록 지원한다.
NFT, Token, Wallet, Blockchain, Price, DeFi, Streams 등 주요 API를 한 번에 제공함.
모든 데이터는 실시간으로, 크로스체인으로 제공되어 다수의 블록체인에 대응 가능함.

Moralis API 사용 준비
Moralis 계정 생성 및 로그인.

프로젝트를 생성하고, Web3 API 메뉴에서 API Key를 발급받음.
API Key를 환경 변수 또는 백엔드 파일 내 안전하게 관리.

EVM 컨트랙트 데이터 수집 주요 엔드포인트
Moralis Web3 Data API는 다음과 같은 기능 엔드포인트를 지원하며, 모두 REST 방식으로 활용 가능하다:

NFT 데이터: 메타데이터, 소유자 정보, 전송 히스토리, 가격.
토큰 데이터: 실시간 가격 정보, 소유자, 전송 내역.
트랜잭션 데이터: 모든 트랜잭션, 내역, on-chain 활동 분석.
블록 데이터: 블록 내 트랜잭션, 내부 트랜잭션, 이벤트, 로그.
이벤트/로그 데이터: 특정 컨트랙트의 이벤트, 트랜잭션 로그 조회.
DeFi 관련 데이터: 유동성, 페어 정보 등 DeFi 시장 데이터.

컨트랙트 로그 및 이벤트 조회 예시
컨트랙트 관련 이벤트와 로그는 아래 Get Contract Logs 엔드포인트를 통해 수집 가능:

주소 및 체인 지정 → Moralis Event API 사용
옵션 파라미터: fromBlock, toBlock, fromDate, toDate 등
반환 데이터: 블록 넘버, 이벤트 타입, 트랜잭션 해시, 시간, 컨트랙트 주소 등


통합 개발 절차 요약
Moralis API Key 획득 및 프로젝트 준비.
REST API 스펙 확인 후 필요한 데이터 엔드포인트 선정.

각 엔드포인트로 HTTP 요청(axios/fetch 등 사용)해 데이터 수집.
반환 데이터 구조 분석, 실시간 데이터 시각화 및 저장.
이벤트/트랜잭션/토큰/NFT/DeFi 등 원하는 컨트랙트 관련 정보 분석.

EVM API
이 섹션은 EVM Web3 데이터 내의 모든 메서드 전체 목록을 포함합니다.
Swagger EVM API: https://deep-index.moralis.io/api-docs-2.2/

카테고리별 전체 API 목록
다음 카테고리 중 하나를 선택하여 원하는 메서드를 찾으세요.

Wallet API
NFT API
Token API
DeFi API
Entity API
Price API
Blockchain API
Utils

Premium Endpoints

Wallet API
원하는 기능을 선택하세요:

Get Wallet History
No.	Method	Description	URL
1	getWalletHistory	Get full wallet history	https://deep-index.moralis.io/api/v2.2/wallets/:address/history
2	getWalletTransactions	Get native transactions by wallet	https://deep-index.moralis.io/api/v2.2/:address
3	getWalletTransactionsVerbose	Get decoded transactions by wallet	https://deep-index.moralis.io/api/v2.2/:address/verbose
4	getWalletTokenTransfers	Get ERC20 transfers by wallet	https://deep-index.moralis.io/api/v2.2/:address/erc20/transfers
5	getWalletNFTTransfers	Get NFT transfers by wallet	https://deep-index.moralis.io/api/v2.2/:address/nft/transfers
6	getNFTTradesByWallet	Get NFT trades by wallet	https://deep-index.moralis.io/api/v2.2/wallets/:address/nfts/trades

Sheets로 내보내기
Get Wallet Token Balances
No.	Method	Description	URL
7	getWalletTokenBalances	Get ERC20 token balance by wallet	https://deep-index.moralis.io/api/v2.2/:address/erc20
8	getWalletTokenBalancesPrices	Get Native & ERC20 token balances & prices by wallet	https://deep-index.moralis.io/api/v2.2/wallets/:address/tokens
9	getNativeBalance	Get native balance by wallet	https://deep-index.moralis.io/api/v2.2/:address/balance
10	getNativeBalancesForAddresses	Get native balance for multiple wallets	https://deep-index.moralis.io/api/v2.2/wallets/balances

Sheets로 내보내기
Get Wallet Token Approvals
No.	Method	Description	URL
11	getWalletApprovals	Get ERC20 approvals by wallet	https://deep-index.moralis.io/api-docs-2.2/#/Wallets/getWalletApprovals

Sheets로 내보내기
Get Wallet Token Swaps
No.	Method	Description	URL
12	getSwapsByWalletAddress	Get swaps by wallet address	https://deep-index.moralis.io/api/v2.2/wallets/:address/swaps

Sheets로 내보내기
Get Wallet NFT Balances
No.	Method	Description	URL
13	getWalletNFTs	Get NFTs by wallet	https://deep-index.moralis.io/api/v2.2/:address/nft
14	getWalletNFTCollections	Get NFT collections by wallet	https://deep-index.moralis.io/api/v2.2/:address/nft/collections

Sheets로 내보내기
Get Wallet DeFi Positions
No.	Method	Description	URL
15	getDefiSummary	Get DeFi protocols by wallet	https://deep-index.moralis.io/api/v2.2/wallets/:address/defi/summary
16	getDefiPositionsSummary	Get DeFi positions by wallet	https://deep-index.moralis.io/api/v2.2/wallets/:address/defi/positions
17	getDefiPositionsByProtocol	Get detailed DeFi positions by wallet and protocol	https://deep-index.moralis.io/api/v2.2/wallets/:address/defi/:protocol/positions

Sheets로 내보내기
Get Wallet Net-worth
No.	Method	Description	URL
18	getWalletNetWorth	Get wallet net-worth	https://deep-index.moralis.io/api/v2.2/wallets/:address/net-worth

Sheets로 내보내기
Get Wallet PnL
No.	Method	Description	URL
19	getWalletProfitabilitySummary	Get Wallet PnL Summary	https://deep-index.moralis.io/api/v2.2/wallets/:address/profitability/summary
20	getWalletProfitability	Get Wallet PnL Breakdown	https://deep-index.moralis.io/api/v2.2/wallets/:address/profitability

Sheets로 내보내기
Get Wallet Details
No.	Method	Description	URL
21	getWalletActiveChains	Get chain activity by wallet	https://deep-index.moralis.io/api/v2.2/wallets/:address/chains
22	getWalletStats	Get wallet stats	https://deep-index.moralis.io/api/v2.2/wallets/:address/stats

Sheets로 내보내기
Get Wallet Domains
No.	Method	Description	URL
23	resolveAddress	ENS Lookup by Address	https://deep-index.moralis.io/api/v2.2/resolve/:address/reverse
24	resolveENSDomain	ENS Lookup by Domain	https://deep-index.moralis.io/api/v2.2/resolve/ens/:domain
25	resolveAddressToDomain	Unstoppable Lookup by Address	https://deep-index.moralis.io/api/v2.2/resolve/:address/domain
26	resolveDomain	Unstoppable Lookup by Domain	https://deep-index.moralis.io/api/v2.2/resolve/:domain

Sheets로 내보내기
NFT API
원하는 기능을 선택하세요:

Get NFTs
No.	Method	Description	Spam Detection	URL
1	getWalletNFTs	Get NFTs by wallet	✅	https://deep-index.moralis.io/api/v2.2/:address/nft
2	getMultipleNFTs	Get multiple NFTs	✅	https://deep-index.moralis.io/api/v2.2/nft/getMultipleNFTs
3	getContractNFTs	Get NFTs by contract	✅	https://deep-index.moralis.io/api/v2.2/nft/:address

Sheets로 내보내기
Get NFT Metadata
No.	Method	Description	Spam Detection	URL
4	reSyncMetadata	Resync metadata		https://deep-index.moralis.io/api/v2.2/nft/:address/:token_id/metadata/resync
5	getNFTMetadata	Get NFT data		https://deep-index.moralis.io/api/v2.2/nft/:address/:token_id

Sheets로 내보내기
Get NFT Transfers
No.	Method	Description	Spam Detection	URL
6	getWalletNFTTransfers	Get transfers by wallet	✅	https://deep-index.moralis.io/api/v2.2/:address/nft/transfers
7	getNFTContractTransfers	Get transfers by contract	✅	https://deep-index.moralis.io/api/v2.2/nft/:address/transfers
8	getNFTTransfers	Get transfers by contract and token ID	✅	https://deep-index.moralis.io/api/v2.2/nft/:address/:token_id/transfers

Sheets로 내보내기
Get NFT Collections
No.	Method	Description	Spam Detection	URL
9	getWalletNFTCollections	Get collections by wallet	✅	https://deep-index.moralis.io/api/v2.2/:address/nft/collections
10	getNFTContractMetadata	Get contract metadata	✅	https://deep-index.moralis.io/api/v2.2/nft/:address/metadata
11	syncNFTContract	Sync NFT contract		https://deep-index.moralis.io/api/v2.2/nft/:address/sync

Sheets로 내보내기
Get NFT Owners
No.	Method	Description	Spam Detection	URL
12	getNFTOwners	Get NFT owners	✅	https://deep-index.moralis.io/api/v2.2/nft/:address/owners
13	getNFTTokenIdOwners	Get token ID owners	✅	https://deep-index.moralis.io/api/v2.2/nft/:address/:token_id/owners

Sheets로 내보내기
Get NFT Prices
No.	Method	Description	URL
14	getNFTFloorPriceByContract	Get NFT floor price by contract	https://deep-index.moralis.io/api/v2.2/nft/:address/floor-price
15	getNFTFloorPriceByToken	Get NFT floor price by token	https://deep-index.moralis.io/api/v2.2/nft/:address/:token_id/floor-price
16	getNFTHistoricalFloorPriceByContract	Get historical NFT floor price by contract	https://deep-index.moralis.io/api/v2.2/nft/:address/floor-price/historical
17	getNFTContractSalePrices	Get contract sale prices	https://deep-index.moralis.io/api/v2.2/nft/:address/price
18	getNFTSalePrices	Get sale prices	https://deep-index.moralis.io/api/v2.2/nft/:address/:token_id/price

Sheets로 내보내기
Get NFT Trades
No.	Method	Description	Spam Detection	URL
19	getNFTTrades	Get NFT trades	✅	https://deep-index.moralis.io/api/v2.2/nft/:address/trades
20	getNFTTradesByToken	Get trades by token		https://deep-index.moralis.io/api/v2.2/nft/:address/:token_id/trades
21	getNFTTradesByWallet	Get trades by wallet		https://deep-index.moralis.io/api/v2.2/wallets/:address/nfts/trades

Sheets로 내보내기
Get NFT Stats
No.	Method	Description	Spam Detection	URL
22	getNFTCollectionStats	Get collection stats	✅	https://deep-index.moralis.io/api/v2.2/nft/:address/stats

Sheets로 내보내기
Get NFT Traits and Rarity
No.	Method	Description	Spam Detection	URL
23	getNFTTraitsByCollection	Get NFT traits by collection (single response, limited to 5,000 traits)		https://deep-index.moralis.io/api/v2.2/nft/:address/traits
24	getNFTTraitsByCollectionPaginate	Get NFT traits by collection (paginated, no limit)		https://deep-index.moralis.io/api/v2.2/nft/:address/traits/paginate
25	getNFTsByTraits	Get NFTs by traits	✅	https://deep-index.moralis.io/api/v2.2/nft/:address/nfts-by-traits
26	resyncNFTTraitsByCollection	Resync NFT traits by collection		https://deep-index.moralis.io/api/v2.2/nft/:address/traits/resync

Sheets로 내보내기
Get Trending NFTs
No.	Method	Description	URL
27	getTopNFTCollectionsByMarketCap	Get the top NFT collections by market cap	https://deep-index.moralis.io/api/v2.2/market-data/nfts/top-collections
28	getTopNFTCollectionsByTradingVolume	Get the top NFT collections by trading volume	https://deep-index.moralis.io/api/v2.2/market-data/nfts/hottest-collections

Sheets로 내보내기
Token API
원하는 기능을 선택하세요:

Get Token Balances
No.	Method	Description	URL
1	getWalletTokenBalances	Get ERC20 token balance by wallet	https://deep-index.moralis.io/api/v2.2/:address/erc20
2	getWalletTokenBalancesPrices	Get Native & ERC20 token balances & prices by wallet	https://deep-index.moralis.io/api/v2.2/wallets/:address/tokens

Sheets로 내보내기
Get Token Approvals
No.	Method	Description	URL
3	getWalletApprovals	Get ERC20 approvals by wallet	https://deep-index.moralis.io/api-docs-2.2/#/Wallets/getWalletApprovals

Sheets로 내보내기
Get Token Metadata
No.	Method	Description	URL
4	getTokenMetadataBySymbol	Get ERC20 token metadata by symbols	https://deep-index.moralis.io/api/v2.2/erc20/metadata/symbols
5	getTokenMetadata	Get ERC20 token metadata by contract	https://deep-index.moralis.io/api/v2.2/erc20/metadata
6	getDiscoveryToken	Get token details	https://deep-index.moralis.io/api/v2.2/discovery/token

Sheets로 내보내기
Get Token Price
No.	Method	Description	URL
7	getTokenPrice	Get ERC20 token price	https://deep-index.moralis.io/api/v2.2/erc20/:address/price
8	getMultipleTokenPrices	Get multiple token prices	https://deep-index.moralis.io/api/v2.2/erc20/prices
9	getPairCandlesticks	Get the OHLCV candlesticks by using pair address	https://deep-index.moralis.io/api/v2.2/pairs/:address/ohlcv

Sheets로 내보내기
Get Token Swaps
No.	Method	Description	URL
10	getSwapsByPairAddress	Get swaps by pair address	https://deep-index.moralis.io/api/v2.2/pairs/:address/swaps
11	getSwapsByTokenAddress	Get swaps by ERC20 token address	https://deep-index.moralis.io/api/v2.2/erc20/:address/swaps
12	getSwapsByWalletAddress	Get swaps by wallet address	https://deep-index.moralis.io/api/v2.2/wallets/:address/swaps

Sheets로 내보내기
Get Token Transfers
No.	Method	Description	URL
13	getWalletTokenTransfers	Get ERC20 token transfers by wallet	https://deep-index.moralis.io/api/v2.2/:address/erc20/transfers
14	getTokenTransfers	Get ERC20 token transfers by contract	https://deep-index.moralis.io/api/v2.2/erc20/:address/transfers

Sheets로 내보내기
Get Token Top Traders
No.	Method	Description	URL
15	getTopProfitableWalletPerToken	Get Token Profitable Wallets	https://deep-index.moralis.io/api/v2.2/erc20/:address/top-gainers

Sheets로 내보내기
Get Volume Stats
No.	Method	Description	URL
16	getVolumeStatsByChain	Get volume statistics by chain	https://deep-index.moralis.io/api/v2.2/volume/chains
17	getVolumeStatsByCategory	Get volume and chain data by categories	https://deep-index.moralis.io/api/v2.2/volume/categories?chain=eth
18	getTimeSeriesVolume	Retrieve timeseries volume data by chain	https://deep-index.moralis.io/api/v2.2/volume/timeseries?chain=eth&timeframe=1d
19	getTimeSeriesVolumeByCategory	Retrieve timeseries volume data by category	https://deep-index.moralis.io/api/v2.2/volume/timeseries/artificial-intelligence?chain=eth&timeframe=1d

Sheets로 내보내기
Get Token Pairs & Liquidity
No.	Method	Description	URL
20	getTokenPairs	Get token pairs by address	https://deep-index.moralis.io/api/v2.2/:token_address/pairs
21	getPairStats	Get token pair statistics	https://deep-index.moralis.io/api/v2.2//pairs/:address/stats
22	getAggregatedTokenPairStats	Get aggregated token pair statistics	https://deep-index.moralis.io/api/v2.2/:token_address/pairs/stats
23	getPairAddress	Get DEX token pair address	https://deep-index.moralis.io/api/v2.2/:token0_address/:token1_address/pairAddres
24	getPairReserves	Get DEX token pair reserves	https://deep-index.moralis.io/api/v2.2/:pair_address/reserves

Sheets로 내보내기
Get Token Analytics
No.	Method	Description	URL
25	getTokenAnalytics	Get token analytics	https://deep-index.moralis.io/api/v2.2/tokens/:address/analytics
26	getMultipleTokenAnalytics	Get multiple token analytics	https://deep-index.moralis.io/api/v2.2/tokens/:address/analytics
27	getTimeSeriesTokenAnalytics	Get timeseries token analytics	https://deep-index.moralis.io/api/v2.2/tokens//analytics/timeseries

Sheets로 내보내기
Get Tokens by Exchange
No.	Method	Description	URL
28	getNewTokensByExchange	Get newly launched tokens by exchange	https://deep-index.moralis.io/api/v2.2/erc20/exchange/:exchange/new
29	getBondingTokensByExchange	Get bonding tokens by exchange	https://deep-index.moralis.io/api/v2.2/erc20/exchange/:exchange/bonding
30	getGraduatedTokensByExchange	Get graduated tokens by exchange	https://deep-index.moralis.io/api/v2.2/erc20/exchange/:exchange/graduated
31	getTokenBondingStatus	Get token bonding status	https://deep-index.moralis.io/api/v2.2/erc20/:address/bondingStatus

Sheets로 내보내기
Get Token Stats
No.	Method	Description	URL
32	getTokenStats	Get ERC20 token stats	https://deep-index.moralis.io/api/v2.2/erc20/:address/stats

Sheets로 내보내기
Get Token Holders
No.	Method	Description	URL
32	getTokenHolders	Get ERC20 Token Holders	https://deep-index.moralis.io/api/v2.2/erc20/:token_address/owners
33	getTokenHolderStats	Get ERC20 Token Holders Stats	https://deep-index.moralis.io/api/v2.2/erc20/:token_address/holders
34	getHistoricalTokenHolders	Get ERC20 token holders Stats Timeseries	https://deep-index.moralis.io/api/v2.2/erc20/:token_address/holders/historical

Sheets로 내보내기
Get Token Snipers
No.	Method	Description	URL
35	getSnipersByPairAddress	Get snipers by pair address	https://deep-index.moralis.io/api/v2.2/pairs/:address/snipers

Sheets로 내보내기
Get Trending Tokens
No.	Method	Description	URL
36	getTrendingTokens	Get trending tokens	https://deep-index.moralis.io/api/v2.2/tokens/trending
37	getTopGainersTokens	Get tokens with top gainers	https://deep-index.moralis.io/api/v2.2/discovery/tokens/top-gainers
38	getTopLosersTokens	Get tokens with top losers	https://deep-index.moralis.io/api/v2.2/discovery/tokens/top-losers
39	getTopERC20TokensByMarketCap	Get the top ERC20 tokens by market cap	https://deep-index.moralis.io/api/v2.2/market-data/erc20s/top-tokens

Sheets로 내보내기
Get Filtered Tokens
No.	Method	Description	URL
40	getFilteredTokens	Get filtered tokens	https://deep-index.moralis.io/api/v2.2/discovery/tokens

Sheets로 내보내기
Search Tokens
No.	Method	Description	URL
41	searchTokens	Search tokens	https://deep-index.moralis.io/api/v2.2/tokens/search

Sheets로 내보내기
DeFi API
원하는 기능을 선택하세요:

Get Wallet DeFi Positions
No.	Method	Description	URL
1	getDefiSummary	Get DeFi protocols by wallet	https://deep-index.moralis.io/api/v2.2/wallets/:address/defi/summary
2	getDefiPositionsSummary	Get DeFi positions by wallet	https://deep-index.moralis.io/api/v2.2/wallets/:address/defi/positions
3	getDefiPositionsByProtocol	Get detailed DeFi positions by wallet and protocol	https://deep-index.moralis.io/api/v2.2/wallets/:address/defi/:protocol/positions

Sheets로 내보내기
Entity API
원하는 기능을 선택하세요:

Search Entities
No.	Method	Description	URL
1	searchEntities	Search for entities, addresses, and categories	https://deep-index.moralis.io/api/v2.2/entities/search

Sheets로 내보내기
Get Entity Categories
No.	Method	Description	URL
2	getEntityCategories	Get entity categories	https://deep-index.moralis.io/api/v2.2/entities/categories

Sheets로 내보내기
Get Entities
No.	Method	Description	URL
3	getEntitiesByCategory	Get entities by category	https://deep-index.moralis.io/api/v2.2/entities/categories/:categoryId
4	getEntity	Get entity by ID	https://deep-index.moralis.io/api/v2.2/entities/:entityId

Sheets로 내보내기
Price API
원하는 기능을 선택하세요:

Get NFT Prices
No.	Method	Description	URL
1	getNFTFloorPriceByContract	Get NFT floor price by contract	https://deep-index.moralis.io/api/v2.2/nft/:address/floor-price
2	getNFTFloorPriceByToken	Get NFT floor price by token	https://deep-index.moralis.io/api/v2.2/nft/:address/:token_id/floor-price
3	getNFTHistoricalFloorPriceByContract	Get historical NFT floor price by contract	https://deep-index.moralis.io/api/v2.2/nft/:address/floor-price/historical
4	getNFTContractSalePrices	Get contract sale prices	https://deep-index.moralis.io/api/v2.2/nft/:address/price
5	getNFTSalePrices	Get sale prices	https://deep-index.moralis.io/api/v2.2/nft/:address/:token_id/price

Sheets로 내보내기
Get Token Prices
No.	Method	Description	URL
6	getTokenPrice	Get ERC20 token price	https://deep-index.moralis.io/api/v2.2/erc20/:address/price
7	getMultipleTokenPrices	Get multiple token prices	https://deep-index.moralis.io/api/v2.2/erc20/prices
8	getPairCandlesticks	Get the OHLCV candlesticks by using pair address	https://deep-index.moralis.io/api/v2.2/pairs/:address/ohlcv

Sheets로 내보내기
Blockchain API
원하는 기능을 선택하세요:

Get Blocks
No.	Method	Description	URL
1	getBlockByHash	Get block by hash	https://deep-index.moralis.io/api/v2.2/block/:block_number_or_hash
2	getBlockByDate	Get block by date	https://deep-index.moralis.io/api/v2.2/dateToBlock

Sheets로 내보내기
Get Transactions
No.	Method	Description	URL
3	getDecodedWalletTransaction	Get decoded transactions by wallet	https://deep-index.moralis.io/api/v2.2/:address/verbose
4	getTransactionByHash	Get transaction by hash	https://deep-index.moralis.io/api/v2.2/transaction/:transaction_hash
5	getDecodedTransactionByHash	Get decoded transaction by hash	https://deep-index.moralis.io/api/v2.2/transaction/:transaction_hash/verbose
6	getWalletTransactions	Get native transactions by wallet	https://deep-index.moralis.io/api/v2.2/:address

Sheets로 내보내기
Get Latest Block Number
No.	Method	Description	URL
7	getLatestBlockNumber	Get latest block number	https://deep-index.moralis.io/api/v2.2/latestBlockNumber/:chain

Sheets로 내보내기
Utils
No.	Method	Description	URL
1	getAPIVersion	Get API version	https://deep-index.moralis.io/api/v2.2/web3/version
2	getEndpointWeights	Get weights of endpoints	https://deep-index.moralis.io/api/v2.2/info/endpointWeights
3	reviewContracts	Review contracts	https://deep-index.moralis.io/api/v2.2/contracts-review

Sheets로 내보내기
Premium Endpoints
No.	Method	Description	URL
1	getVolumeStatsByChain	Get volume statistics by chain	https://deep-index.moralis.io/api/v2.2/volume/chains
2	getVolumeStatsByCategory	Get volume and chain data by categories	https://deep-index.moralis.io/api/v2.2/volume/categories?chain=eth
3	getTimeSeriesVolume	Retrieve timeseries volume data by chain	https://deep-index.moralis.io/api/v2.2/volume/timeseries?chain=eth&timeframe=1d
4	getTimeSeriesVolumeByCategory	Retrieve timeseries volume data by category	https://deep-index.moralis.io/api/v2.2/volume/timeseries/artificial-intelligence?chain=eth&timeframe=1d
5	searchTokens	Search tokens	https://deep-index.moralis.io/api/v2.2/tokens/search
6	getMultipleTokenAnalytics	Get multiple token analytics	https://deep-index.moralis.io/api/v2.2/tokens/analytics
7	getFilteredTokens	Get filtered tokens	https://deep-index.moralis.io/api/v2.2/discovery/tokens
8	getDiscoveryToken	Get token details	https://deep-index.moralis.io/api/v2.2/discovery/token


