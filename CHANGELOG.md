## [2.2.0-beta-claude.1](https://github.com/ZunoKit/zuno-marketplace-sdk/compare/v2.1.0...v2.2.0-beta-claude.1) (2026-01-11)

### ✨ Features

- add release manifest for version 2.2.0 and update environment configuration ([d654f14](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/d654f149eccec2b6b25b7852db69a88c8e087aa5))
- enhance settings.json with additional hooks for improved command execution ([f207f86](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/f207f86833914165677fc2d6ebbca9ad8d46c3ff))

### 🐛 Bug Fixes

- update src/react/provider/WagmiProviderSync.tsx ([63baa78](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/63baa78e6ef6600aebc3711ee29037958a514d29))
- update src/utils/logStore.ts ([b4f74ec](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/b4f74eca55f159c3e77ee59c9550601c615518ea))

### ♻️ Code Refactoring

- standardize string quotes and improve code formatting in AuctionModule, useProviderSync, batch utilities, and logStore ([d26bead](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/d26beadc7c75eaaf65ad7822a93d26f945bb8777))

## [2.1.0](https://github.com/ZunoKit/zuno-marketplace-sdk/compare/v2.0.0...v2.1.0) (2026-01-11)

### ✨ Features

- add batch progress events for better UX ([61a831e](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/61a831e110364bb4c246f59cb811ba16863b1ce9)), closes [#28](https://github.com/ZunoKit/zuno-marketplace-sdk/issues/28)
- add listingId bytes32 format validation ([b7d6a94](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/b7d6a948f9c6bb43cca0f7b0770462b06aafa081)), closes [#20](https://github.com/ZunoKit/zuno-marketplace-sdk/issues/20)
- Add WagmiSignerSync export and SSR support (Issues [#44](https://github.com/ZunoKit/zuno-marketplace-sdk/issues/44), [#45](https://github.com/ZunoKit/zuno-marketplace-sdk/issues/45)) ([ec069ed](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/ec069edff12aa22423a82159f22311def3833ee2))
- add warning logs for Dutch auction price clamp adjustments ([6f33ff1](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/6f33ff1b772494e43a28718995d7fdc2fe1c7ac3)), closes [#24](https://github.com/ZunoKit/zuno-marketplace-sdk/issues/24)
- enhance transactionStore with retry logic and history ([b83aab3](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/b83aab34bbf2994c463fa2931f4cd727aef22b38)), closes [#29](https://github.com/ZunoKit/zuno-marketplace-sdk/issues/29)

### 🐛 Bug Fixes

- remove unused ErrorCodes import after batch validation refactor ([1f1de5c](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/1f1de5c1f4fd4ece09e9a039c234d65788e88195))
- remove unused imports from integration test ([d2a39f1](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/d2a39f1f0ed6995e7cba5e7d2631a1690ec577e7))
- remove unused validateTokenId import ([22e24b4](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/22e24b4f9ec1ffe341912a1a77ddd800f9a2509c))
- replace require() with ES6 imports in testing utilities ([d3cb76c](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/d3cb76ca03781fcb45af3e0cdad8c78235f5756e))
- resolve type safety violations in updateProvider ([fd17366](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/fd173667f2d993c87c3b13e352a2665aa68a10cf))

### ⚡️ Performance Improvements

- implement approval status caching to reduce RPC calls ([65a62f2](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/65a62f204fb7b66b68c22ab50d95e1271df66dc2)), closes [#19](https://github.com/ZunoKit/zuno-marketplace-sdk/issues/19)
- improve logStore performance under high-frequency logging ([46cb9bc](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/46cb9bcdc8779e1d524c5ee3cf43e3ec91986d6a)), closes [#30](https://github.com/ZunoKit/zuno-marketplace-sdk/issues/30)

### ♻️ Code Refactoring

- enhance settings configuration and streamline migration documentation ([dd82826](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/dd8282629878ada6d26dcf879a20d0f0f7fd520f))
- extract batch validation into shared utility (DRY) ([6344e1a](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/6344e1a69e263e0320c7c866945889e66eab7594)), closes [#25](https://github.com/ZunoKit/zuno-marketplace-sdk/issues/25)
- improve settings validation and update migration instructions ([090a993](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/090a993aec36e32ac04575daa8270163a7bfdb60))
- replace hardcoded cache times with configurable constants using ms library ([cf0489c](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/cf0489cb5001bb73449c5c5f2aee39dc54fcd312)), closes [#47](https://github.com/ZunoKit/zuno-marketplace-sdk/issues/47)
- standardize error messages across validation functions ([f35364e](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/f35364e2aff2b829871fb49902b0c16ee2066384)), closes [#21](https://github.com/ZunoKit/zuno-marketplace-sdk/issues/21)
- update CLAUDE.md and .gitignore for improved documentation and file management ([8c1d679](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/8c1d679b5bda5ada74f971c5cbc240415af12b4a))
- update permissions structure in settings and remove outdated migration guide ([a3f9fd0](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/a3f9fd080a8de67a89ee5d50ffa6a008d8bc1d59))

## [2.0.1-beta-claude.2](https://github.com/ZunoKit/zuno-marketplace-sdk/compare/v2.0.1-beta-claude.1...v2.0.1-beta-claude.2) (2025-12-07)

### ♻️ Code Refactoring

- update CLAUDE.md and .gitignore for improved documentation and file management ([8c1d679](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/8c1d679b5bda5ada74f971c5cbc240415af12b4a))

## [2.0.1-beta-claude.1](https://github.com/ZunoKit/zuno-marketplace-sdk/compare/v2.0.0...v2.0.1-beta-claude.1) (2025-12-07)

### ♻️ Code Refactoring

- replace hardcoded cache times with configurable constants using ms library ([cf0489c](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/cf0489cb5001bb73449c5c5f2aee39dc54fcd312)), closes [#47](https://github.com/ZunoKit/zuno-marketplace-sdk/issues/47)

## [2.0.0](https://github.com/ZunoKit/zuno-marketplace-sdk/compare/v1.1.5...v2.0.0) (2025-12-01)

### ⚠ BREAKING CHANGES

- **ZunoDevTools Import Path** - The `ZunoDevTools` component has been moved from `zuno-marketplace-sdk/devtools` to `zuno-marketplace-sdk/react`
  - The standalone `/devtools` module has been removed
  - `ZunoDevTools` is now exported from the `/react` module alongside other React components
  - This change consolidates all React-related exports into a single entry point

**Migration Required:** Update your import statements to use the new path.

**Before:**

```typescript
import { ZunoDevTools } from "zuno-marketplace-sdk/devtools";
```

**After:**

```typescript
import { ZunoDevTools } from "zuno-marketplace-sdk/react";
```

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>

### ✨ Features

- add batch auction creation methods ([4161506](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/4161506075605e02be36bc40c3cc6c4d6020c5f4))
- add batch cancel listing hook and listing query hooks ([f1683c3](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/f1683c329d9633c6f4bda00b1ba6bb3f7cc83a11))
- add batch minting functionality for ERC1155 collections and enhance README ([0a1a268](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/0a1a26836d643e2875a24410c89a5f3b4579d11d))
- add batch minting functionality for ERC721 collections ([99c721a](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/99c721a198d0e12fa21cd163adc04a0c163c5917))
- add batchBuyNFT to useExchange hook ([d8ce88c](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/d8ce88c800424e167fedcaaf382396bfc965066a))
- add batchCancelAuction method and hook ([24a3a88](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/24a3a883594ae0552e6a7455d0c08d4cc8965a9c))
- add buyNow and withdrawBid methods to AuctionModule and corresponding hooks ([5891894](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/589189498189ce062167ac57b2b53eb168390dc9))
- add ensureApproval method to AuctionModule for NFT collection approval ([cfc1d4e](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/cfc1d4e5386c27f1d85dd8d8262cd81652ff84d8))
- add getBuyerPrice method to get total price including fees ([b5e452b](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/b5e452b50b21ebc15305d74c793b24a23cfb7bdb))
- add getCreatedCollections method and useCreatedCollections hook ([d103185](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/d10318577f521413199f97110ccd5cc985fdd75d))
- add getListingsBySeller to SDK core ([7c42c92](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/7c42c92c28967ed379ce79703fe054407326fa4f))
- add getPendingRefund method and corresponding hook for auction bidders ([af667bb](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/af667bb17be5abd17d3faf824017fec8fbf04f9a))
- add getUserMintedTokens method and useUserMintedTokens hook ([15814cc](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/15814cc543e3c49024a03619d0bf368fe20ccd03))
- add getUserOwnedTokens method to CollectionModule ([d567d49](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/d567d49d4e4f93632061c23a6a348017dce45832))
- add network utilities and constants to ZunoAPIClient ([3cf9b2f](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/3cf9b2fc3957929c74f69aab1a8703ade346d944))
- add SDK instance access, singleton pattern, and enhanced errors ([24c5cf2](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/24c5cf2a5a5d20b706efaa5a30dc5401e3b71ed7))
- add v1.3.0 improvements - tree-shakeable imports, testing utilities, devtools, and logger ([317050e](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/317050e9cdbae6d995bed5633565d1e123a01f60))
- enable CORS credentials in ZunoAPIClient configuration ([8b63575](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/8b63575ccdd1af4a7c0fe64a85ccd2fbecb55777))
- enhance CollectionParams and CollectionModule with new minting parameters ([c7a555e](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/c7a555e2bff66e9d36af4dd2fbbc59c52f189188))
- enhance extractCollectionAddress method with improved logging and event handling ([779c429](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/779c4299f94bfb26c3aa5b9f70bceea29481e1ff))
- enhance logging and error handling in CollectionModule ([254c2ca](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/254c2caefd5d9913acfb0bd27eea4d5e0e8c2629))
- enhance logging capabilities with Zuno DevTools integration ([d5cc826](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/d5cc826e84c4d270e882cefc2a1bfebf7da73676))
- implement ensureApproval method in ExchangeModule ([8ec46fb](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/8ec46fbce514f92d29228ba2c7b58b0ac94c6936))
- integrate transaction management into Zuno SDK ([7540a09](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/7540a0971ca5c27747940f6cabb1e42cd4c195a2))
- refactor auction retrieval logic in AuctionModule for improved efficiency ([1761715](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/1761715d94deab7c6e079e9eb6cdd10bf23f5fa4))
- refactor Zuno DevTools and remove standalone devtools module ([638b647](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/638b647ebe53afa7b3a6b05b2f5b42ebf0e18721))
- setup semantic-release with dynamic config ([10a4e28](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/10a4e289e3a4b0373fa08d45074c1fa778f07241))
- update mintERC1155 method to streamline parameters and logging ([c38fe81](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/c38fe8107add5b21d6f0b865fb18897322b326ce))

### 🐛 Bug Fixes

- add getContractByName method and fix CORS withCredentials ([e18ca12](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/e18ca1203f1647120b4a8acc49d1f86179a088fe))
- allowlist bug - mintStartTime default to now + add allowlist methods ([2036f74](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/2036f74ac4813652b1174faf9baad866c4a5a09c))
- auto-create provider from rpcUrl and make DevTools resilient ([0dc480f](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/0dc480f502f9fe4d78d978d1a653c64c540e6a2e))
- buyNFT value conversion, add real batchListNFT (1 tx per collection) ([95d7831](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/95d783185a80009e2f712b07aebd3c97d478fe2e))
- convert ETH value to wei in buyNFT and batchBuyNFT ([cc56b3d](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/cc56b3d59a3e26b8f9b1f482986dcb8e57eb1e8d))
- correct test assertions for mock SDK methods and expectZunoError ([a2623c0](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/a2623c07da304cf1bd54041dcfdcd48f62cda19e))
- default allowlistMintPrice and publicMintPrice to mintPrice ([a06a74e](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/a06a74ed40b7deb0e40e91ded5fba95316f3d445))
- disable npm publishing temporarily ([85d60a3](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/85d60a39750a71ca992392e599ae24a83d850a14))
- enable Claude to trigger on PR with [@claude](https://github.com/claude) in description or title ([0a5297e](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/0a5297e4c307ae09e4d019fd30eaea64db5e9823))
- exclude .claude directory from Jest test paths ([f4eb0aa](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/f4eb0aa92d1fae92eb804b69f8566e63e66f1f2b))
- getCollectionInfo use minimal ABI instead of fetching from API ([e3333fc](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/e3333fc127b4b7c9d4efb29495a1d6bfe0e291af))
- mock ZunoProvider to avoid wagmi ESM issues in tests ([40df1a9](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/40df1a90fc1a3c4953283bc579366be50314a0ef))
- normalize addresses to proper checksum format ([1075afc](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/1075afc73bcc86074bbf8baada4c720512235c4b))
- parse listing data using named properties instead of array index ([3d2bb83](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/3d2bb83ca1f8242ff37b27ff2310e66a39e96131))
- remove unused InterfaceAbi import ([3d70d2b](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/3d70d2b9ad82dac87b918e124bdce6473dfa44f5))
- resolve PR review issues ([0618734](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/0618734327a9fb8ebf63a0bc595a9747c3580f67))
- resolve test timeouts and mock issues in unit and integration tests ([30e9e8a](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/30e9e8aa0a4d5651986280792e2e8fa77f5f3e5b))
- resolve test TypeScript errors and jest config ([d1efbd0](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/d1efbd01a3e4a99229047b917fcf20101e0c794d))
- resolve v1.3.0 feedback issues ([fa25c2b](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/fa25c2bf1cec9becb1888730e92b5044c7a2e4f3))
- SDK bugs found during E2E testing ([d53dddc](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/d53dddc28dd050e3f325606549975a2ae90341bd))
- update minimal ABI for Zuno collection view functions ([46057f1](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/46057f1f4c5e4ff3d94a451584ed5f4e57adb01f))
- use implementation ABI from zuno-abis API for collections ([8161354](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/8161354cf4489e440adbdb0ea489c01748d85223))
- use minimal ABI for collection operations (implementation ABIs not in API yet) ([bcf4df0](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/bcf4df0b9d9387ed6703d62954fa1b207f01c142))
- ZunoDevTools auto-capture SDK logger and use hooks for sdk/queryClient ([8b299a1](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/8b299a1216d66f709e789069e898f665300a7cfc))

### ♻️ Code Refactoring

- clean formatListing - use ethers.Result type instead of type casting ([40fc2b0](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/40fc2b0e1e1a09a50aeda87643f0f350b1d977e7))
- clean up ExchangeModule - use shared types, extract log parsing ([89fb099](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/89fb0992909d3dd0fdb8c176859e455bc38fa30d))
- enhance auction handling and logging in AuctionModule and ZunoDevTools ([69dd20c](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/69dd20c585561f7db31da5067f8e712fc6bb02c6))
- enhance price drop calculation in AuctionModule for clarity and accuracy ([31fc4b4](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/31fc4b497484666c4a127433b7517edaa674d14c))
- enhance useWallet hook with error handling and type definitions ([6a7997b](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/6a7997bb0ccb57ebfd1fede56b2be95a6b153470))
- improve getUserMintedTokens method in CollectionModule for enhanced logging and efficiency ([505de7a](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/505de7a0fd17b7b46c08241dc2d914187d8fc5a1))
- remove getUserMintedTokens, keep only getUserOwnedTokens ([571340b](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/571340bd3e3a0cf0af52d9dffd17733dfc855fc9))
- remove unused validateAmount import from ExchangeModule ([245ef36](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/245ef36a657611d6d089f7fbf1b4d25f97b3c01f))
- rename auction methods and enhance collection parameters ([8a6c1b3](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/8a6c1b382f7ed440867c3cc3d56fb959fe408629))
- replace console.log/warn with logStore ([ff7d0a1](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/ff7d0a144ec8ab238decc42561f1923dcc4521ab))
- simplify auction-related hooks and methods in AuctionModule ([b7ef635](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/b7ef635b07d1353aa02983ce96b5ae17a06738da))
- simplify Exchange API to core functions only ([d755415](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/d7554159f85081c1dc5c847c17ccefbb6bfe3988))
- streamline auction retrieval process in AuctionModule ([aa3d60a](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/aa3d60a6965114b724c41b7c8063fdcb1e679e07))
- streamline log processing and remove debug statements in CollectionModule ([7be0cb6](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/7be0cb6a9a034102db5f60efdc323da164c14c7f))
- update auction contract references to implementation versions ([bbc314c](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/bbc314cece450a2b1d5e607e9b4425dbafd078d7))
- update auction contract references to use AuctionFactory in AuctionModule ([01390c0](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/01390c0e2e41233fca11a4449a0d78077cc340e0))
- update contractRegistry visibility in ZunoSDK and enhance auction currentBid logic in AuctionModule ([d7ed4a1](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/d7ed4a15661996fb13c60b9ca707ba20fde3cb8a))

## [2.0.0-beta-claude.9](https://github.com/ZunoKit/zuno-marketplace-sdk/compare/v2.0.0-beta-claude.8...v2.0.0-beta-claude.9) (2025-12-01)

### ✨ Features

- add batch auction creation methods ([4161506](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/4161506075605e02be36bc40c3cc6c4d6020c5f4))
- add batch cancel listing hook and listing query hooks ([f1683c3](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/f1683c329d9633c6f4bda00b1ba6bb3f7cc83a11))
- add batch minting functionality for ERC1155 collections and enhance README ([0a1a268](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/0a1a26836d643e2875a24410c89a5f3b4579d11d))
- add batch minting functionality for ERC721 collections ([99c721a](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/99c721a198d0e12fa21cd163adc04a0c163c5917))
- add batchBuyNFT to useExchange hook ([d8ce88c](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/d8ce88c800424e167fedcaaf382396bfc965066a))
- add batchCancelAuction method and hook ([24a3a88](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/24a3a883594ae0552e6a7455d0c08d4cc8965a9c))
- add buyNow and withdrawBid methods to AuctionModule and corresponding hooks ([5891894](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/589189498189ce062167ac57b2b53eb168390dc9))
- add ensureApproval method to AuctionModule for NFT collection approval ([cfc1d4e](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/cfc1d4e5386c27f1d85dd8d8262cd81652ff84d8))
- add getBuyerPrice method to get total price including fees ([b5e452b](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/b5e452b50b21ebc15305d74c793b24a23cfb7bdb))
- add getCreatedCollections method and useCreatedCollections hook ([d103185](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/d10318577f521413199f97110ccd5cc985fdd75d))
- add getListingsBySeller to SDK core ([7c42c92](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/7c42c92c28967ed379ce79703fe054407326fa4f))
- add getPendingRefund method and corresponding hook for auction bidders ([af667bb](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/af667bb17be5abd17d3faf824017fec8fbf04f9a))
- add getUserMintedTokens method and useUserMintedTokens hook ([15814cc](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/15814cc543e3c49024a03619d0bf368fe20ccd03))
- add getUserOwnedTokens method to CollectionModule ([d567d49](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/d567d49d4e4f93632061c23a6a348017dce45832))
- enhance logging and error handling in CollectionModule ([254c2ca](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/254c2caefd5d9913acfb0bd27eea4d5e0e8c2629))
- enhance logging capabilities with Zuno DevTools integration ([d5cc826](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/d5cc826e84c4d270e882cefc2a1bfebf7da73676))
- implement ensureApproval method in ExchangeModule ([8ec46fb](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/8ec46fbce514f92d29228ba2c7b58b0ac94c6936))
- integrate transaction management into Zuno SDK ([7540a09](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/7540a0971ca5c27747940f6cabb1e42cd4c195a2))
- refactor auction retrieval logic in AuctionModule for improved efficiency ([1761715](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/1761715d94deab7c6e079e9eb6cdd10bf23f5fa4))
- refactor Zuno DevTools and remove standalone devtools module ([638b647](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/638b647ebe53afa7b3a6b05b2f5b42ebf0e18721))
- update mintERC1155 method to streamline parameters and logging ([c38fe81](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/c38fe8107add5b21d6f0b865fb18897322b326ce))

### 🐛 Bug Fixes

- allowlist bug - mintStartTime default to now + add allowlist methods ([2036f74](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/2036f74ac4813652b1174faf9baad866c4a5a09c))
- buyNFT value conversion, add real batchListNFT (1 tx per collection) ([95d7831](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/95d783185a80009e2f712b07aebd3c97d478fe2e))
- convert ETH value to wei in buyNFT and batchBuyNFT ([cc56b3d](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/cc56b3d59a3e26b8f9b1f482986dcb8e57eb1e8d))
- default allowlistMintPrice and publicMintPrice to mintPrice ([a06a74e](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/a06a74ed40b7deb0e40e91ded5fba95316f3d445))
- normalize addresses to proper checksum format ([1075afc](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/1075afc73bcc86074bbf8baada4c720512235c4b))
- parse listing data using named properties instead of array index ([3d2bb83](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/3d2bb83ca1f8242ff37b27ff2310e66a39e96131))
- resolve test TypeScript errors and jest config ([d1efbd0](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/d1efbd01a3e4a99229047b917fcf20101e0c794d))
- SDK bugs found during E2E testing ([d53dddc](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/d53dddc28dd050e3f325606549975a2ae90341bd))
- update minimal ABI for Zuno collection view functions ([46057f1](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/46057f1f4c5e4ff3d94a451584ed5f4e57adb01f))

### ♻️ Code Refactoring

- clean formatListing - use ethers.Result type instead of type casting ([40fc2b0](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/40fc2b0e1e1a09a50aeda87643f0f350b1d977e7))
- clean up ExchangeModule - use shared types, extract log parsing ([89fb099](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/89fb0992909d3dd0fdb8c176859e455bc38fa30d))
- enhance auction handling and logging in AuctionModule and ZunoDevTools ([69dd20c](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/69dd20c585561f7db31da5067f8e712fc6bb02c6))
- enhance price drop calculation in AuctionModule for clarity and accuracy ([31fc4b4](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/31fc4b497484666c4a127433b7517edaa674d14c))
- improve getUserMintedTokens method in CollectionModule for enhanced logging and efficiency ([505de7a](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/505de7a0fd17b7b46c08241dc2d914187d8fc5a1))
- remove getUserMintedTokens, keep only getUserOwnedTokens ([571340b](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/571340bd3e3a0cf0af52d9dffd17733dfc855fc9))
- replace console.log/warn with logStore ([ff7d0a1](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/ff7d0a144ec8ab238decc42561f1923dcc4521ab))
- simplify auction-related hooks and methods in AuctionModule ([b7ef635](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/b7ef635b07d1353aa02983ce96b5ae17a06738da))
- simplify Exchange API to core functions only ([d755415](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/d7554159f85081c1dc5c847c17ccefbb6bfe3988))
- streamline auction retrieval process in AuctionModule ([aa3d60a](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/aa3d60a6965114b724c41b7c8063fdcb1e679e07))
- streamline log processing and remove debug statements in CollectionModule ([7be0cb6](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/7be0cb6a9a034102db5f60efdc323da164c14c7f))
- update auction contract references to implementation versions ([bbc314c](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/bbc314cece450a2b1d5e607e9b4425dbafd078d7))
- update auction contract references to use AuctionFactory in AuctionModule ([01390c0](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/01390c0e2e41233fca11a4449a0d78077cc340e0))
- update contractRegistry visibility in ZunoSDK and enhance auction currentBid logic in AuctionModule ([d7ed4a1](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/d7ed4a15661996fb13c60b9ca707ba20fde3cb8a))

## [2.0.0-beta-claude.8](https://github.com/ZunoKit/zuno-marketplace-sdk/compare/v2.0.0-beta-claude.7...v2.0.0-beta-claude.8) (2025-11-29)

### 🐛 Bug Fixes

- auto-create provider from rpcUrl and make DevTools resilient ([0dc480f](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/0dc480f502f9fe4d78d978d1a653c64c540e6a2e))

## [2.0.0-beta-claude.7](https://github.com/ZunoKit/zuno-marketplace-sdk/compare/v2.0.0-beta-claude.6...v2.0.0-beta-claude.7) (2025-11-29)

### 🐛 Bug Fixes

- getCollectionInfo use minimal ABI instead of fetching from API ([e3333fc](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/e3333fc127b4b7c9d4efb29495a1d6bfe0e291af))
- remove unused InterfaceAbi import ([3d70d2b](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/3d70d2b9ad82dac87b918e124bdce6473dfa44f5))
- use implementation ABI from zuno-abis API for collections ([8161354](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/8161354cf4489e440adbdb0ea489c01748d85223))
- use minimal ABI for collection operations (implementation ABIs not in API yet) ([bcf4df0](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/bcf4df0b9d9387ed6703d62954fa1b207f01c142))
- ZunoDevTools auto-capture SDK logger and use hooks for sdk/queryClient ([8b299a1](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/8b299a1216d66f709e789069e898f665300a7cfc))

## [2.0.0-beta-claude.6](https://github.com/ZunoKit/zuno-marketplace-sdk/compare/v2.0.0-beta-claude.5...v2.0.0-beta-claude.6) (2025-11-29)

### ✨ Features

- enhance extractCollectionAddress method with improved logging and event handling ([779c429](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/779c4299f94bfb26c3aa5b9f70bceea29481e1ff))

## [2.0.0-beta-claude.5](https://github.com/ZunoKit/zuno-marketplace-sdk/compare/v2.0.0-beta-claude.4...v2.0.0-beta-claude.5) (2025-11-29)

### ✨ Features

- enhance CollectionParams and CollectionModule with new minting parameters ([c7a555e](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/c7a555e2bff66e9d36af4dd2fbbc59c52f189188))

## [2.0.0-beta-claude.4](https://github.com/ZunoKit/zuno-marketplace-sdk/compare/v2.0.0-beta-claude.3...v2.0.0-beta-claude.4) (2025-11-29)

### ♻️ Code Refactoring

- remove unused validateAmount import from ExchangeModule ([245ef36](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/245ef36a657611d6d089f7fbf1b4d25f97b3c01f))
- rename auction methods and enhance collection parameters ([8a6c1b3](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/8a6c1b382f7ed440867c3cc3d56fb959fe408629))

## [2.0.0-beta-claude.3](https://github.com/ZunoKit/zuno-marketplace-sdk/compare/v2.0.0-beta-claude.2...v2.0.0-beta-claude.3) (2025-11-29)

### 🐛 Bug Fixes

- add getContractByName method and fix CORS withCredentials ([e18ca12](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/e18ca1203f1647120b4a8acc49d1f86179a088fe))

## [2.0.0-beta-claude.2](https://github.com/ZunoKit/zuno-marketplace-sdk/compare/v2.0.0-beta-claude.1...v2.0.0-beta-claude.2) (2025-11-29)

### ✨ Features

- enable CORS credentials in ZunoAPIClient configuration ([8b63575](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/8b63575ccdd1af4a7c0fe64a85ccd2fbecb55777))

### ♻️ Code Refactoring

- enhance useWallet hook with error handling and type definitions ([6a7997b](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/6a7997bb0ccb57ebfd1fede56b2be95a6b153470))

## [2.0.0-beta-claude.1](https://github.com/ZunoKit/zuno-marketplace-sdk/compare/v1.2.0-beta-claude.2...v2.0.0-beta-claude.1) (2025-11-29)

### ⚠ BREAKING CHANGES

- none (all changes are additive)

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>

### ✨ Features

- add SDK instance access, singleton pattern, and enhanced errors ([24c5cf2](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/24c5cf2a5a5d20b706efaa5a30dc5401e3b71ed7))
- add v1.3.0 improvements - tree-shakeable imports, testing utilities, devtools, and logger ([317050e](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/317050e9cdbae6d995bed5633565d1e123a01f60))

### 🐛 Bug Fixes

- correct test assertions for mock SDK methods and expectZunoError ([a2623c0](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/a2623c07da304cf1bd54041dcfdcd48f62cda19e))
- exclude .claude directory from Jest test paths ([f4eb0aa](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/f4eb0aa92d1fae92eb804b69f8566e63e66f1f2b))
- mock ZunoProvider to avoid wagmi ESM issues in tests ([40df1a9](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/40df1a90fc1a3c4953283bc579366be50314a0ef))
- resolve PR review issues ([0618734](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/0618734327a9fb8ebf63a0bc595a9747c3580f67))
- resolve v1.3.0 feedback issues ([fa25c2b](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/fa25c2bf1cec9becb1888730e92b5044c7a2e4f3))

## [1.3.0-beta-claude-02](https://github.com/ZunoKit/zuno-marketplace-sdk/compare/v1.3.0-beta-claude-01...v1.3.0-beta-claude-02) (2025-11-29)

### 🐛 Critical Fixes

- **Type Definitions** - Fixed missing `.d.ts` files for `/testing`, `/devtools`, `/logger` sub-paths

  - All sub-path imports now have complete TypeScript support
  - IDE autocomplete now works for all entry points
  - Resolves "Cannot find module" TypeScript errors

- **tsup Configuration** - Consolidated build config for consistency

  - Simplified from 126 lines to 46 lines (63% reduction)
  - Single entry point configuration ensures all modules get `.d.ts` files
  - Improved maintainability with DRY principle

- **Examples** - Updated to use current API

  - Replaced deprecated `abisUrl` with `apiUrl` in `examples/basic-usage.ts`
  - Added helpful comments for API endpoint configuration

- **Package Distribution** - Added CHANGELOG.md to published package
  - Users can now access version history
  - Included in `package.json` files array

### 📊 Technical Details

**Before (v1.3.0-beta.1):**

```
dist/testing/  → NO .d.ts files ❌
dist/devtools/ → NO .d.ts files ❌
dist/logger/   → NO .d.ts files ❌
```

**After (v1.3.0-beta-claude-02):**

```
dist/testing/index.d.ts  ✅
dist/devtools/index.d.ts ✅
dist/logger/index.d.ts   ✅
+ .d.mts versions for all sub-paths
```

### 🎯 Impact

- **TypeScript Support**: Full type safety for all 8 entry points
- **Package Size**: 405.8 kB (includes all type definitions + CHANGELOG)
- **Files**: 63 files (up from 35 - now includes all `.d.ts` and `.d.mts` files)
- **Breaking Changes**: None - fully backward compatible

### 📦 Migration from beta.1

No code changes required. Just update:

```bash
npm install zuno-marketplace-sdk@1.3.0-beta-claude-02
```

All imports that failed in beta.1 now work with full TypeScript support.

---

## [1.3.0-beta-claude-01](https://github.com/ZunoKit/zuno-marketplace-sdk/compare/v1.2.0-beta-claude-04...v1.3.0-beta-claude-01) (2025-11-28)

### ✨ Features

- **Tree-shakeable Module Imports** - Import only what you need for smaller bundles

  - `zuno-marketplace-sdk/exchange` - ExchangeModule only
  - `zuno-marketplace-sdk/auction` - AuctionModule only
  - `zuno-marketplace-sdk/collection` - CollectionModule only

- **Official Testing Utilities** - First-class testing support

  - `zuno-marketplace-sdk/testing` - Complete mock factories and test helpers
  - `createMockSDK()` - Full SDK mock with all modules
  - `createMockLogger()` - Logger mock with call tracking
  - `createMockZunoProvider()` - React testing wrapper
  - Test utilities: `waitFor()`, `createDeferred()`, `expectZunoError()`

- **DevTools Component** - Visual debugging for development

  - `zuno-marketplace-sdk/react` - Floating debug panel (exported from React module)
  - Logs tab - Real-time SDK log viewer
  - Transactions tab - Transaction history
  - Cache tab - React Query cache inspector
  - Network tab - Provider/signer status

- **Pre-configured Logger** - Standalone logger without SDK initialization
  - `zuno-marketplace-sdk/logger` - Direct logger access
  - `configureLogger()` - Configure global logger
  - `logger` proxy - Use anywhere without setup

### 📝 New APIs

**Tree-shakeable Imports:**

```typescript
// Import only what you need
import { ExchangeModule } from "zuno-marketplace-sdk/exchange";
import { AuctionModule } from "zuno-marketplace-sdk/auction";
import { CollectionModule } from "zuno-marketplace-sdk/collection";
```

**Testing Utilities:**

```typescript
import {
  createMockSDK,
  createMockLogger,
  createMockZunoProvider,
  waitFor,
  expectZunoError,
} from "zuno-marketplace-sdk/testing";

// Create complete mock SDK
const mockSdk = createMockSDK({
  exchange: {
    listNFT: createMockFn().mockResolvedValue({ listingId: "1" }),
  },
});

// React testing
const MockProvider = createMockZunoProvider();
render(
  <MockProvider sdk={mockSdk}>
    <YourComponent />
  </MockProvider>
);
```

**DevTools:**

```tsx
import { ZunoDevTools } from "zuno-marketplace-sdk/react";

function App() {
  return (
    <>
      <YourApp />
      {process.env.NODE_ENV === "development" && (
        <ZunoDevTools
          config={{
            showLogger: true,
            showTransactions: true,
            showCache: true,
            showNetwork: true,
            position: "bottom-right",
          }}
        />
      )}
    </>
  );
}
```

**Standalone Logger:**

```typescript
import { logger, configureLogger } from "zuno-marketplace-sdk/logger";

// Configure once
configureLogger({ level: "debug", format: "json" });

// Use anywhere
logger.info("Application started");
logger.error("Something went wrong", { data: { reason: "timeout" } });
```

### 🔧 Improvements

- Custom `MockFn` type that works without Jest dependency
- Consistent return types in useEffect hooks
- Comprehensive test coverage for new utilities

### 📦 No Breaking Changes

All changes are additive. Existing code continues to work without modification.

---

## [1.2.0-beta-claude.3](https://github.com/ZunoKit/zuno-marketplace-sdk/compare/v1.2.0-beta-claude.2...v1.2.0-beta-claude.3) (2025-11-28)

### ✨ Features

- **SDK Instance Access** - New `useZunoSDK()` hook for direct SDK access in React components
- **Logger Access** - New `useZunoLogger()` hook for logger access in React components
- **Singleton Pattern** - `ZunoSDK.getInstance()` for non-React contexts (API routes, utilities, server components)
- **Convenience Functions** - `getSdk()` and `getLogger()` for cleaner imports
- **Enhanced Error Context** - `ErrorContext` interface with contract, method, network, suggestion fields
- **User-Friendly Errors** - `toUserMessage()` method for actionable error messages
- **Hybrid React Support** - `ZunoContextProvider` now accepts `sdk` prop for hybrid usage

### 📝 New APIs

**React Hooks:**

```typescript
import { useZunoSDK, useZunoLogger } from "zuno-marketplace-sdk/react";

function MyComponent() {
  const sdk = useZunoSDK(); // Access full SDK instance
  const logger = useZunoLogger(); // Access logger directly
}
```

**Singleton Pattern (Non-React):**

```typescript
import { ZunoSDK, getSdk, getLogger } from "zuno-marketplace-sdk";

// Initialize once
ZunoSDK.getInstance({ apiKey: "xxx", network: "sepolia" });

// Use anywhere
const sdk = getSdk();
const logger = getLogger();
```

**Enhanced Errors:**

```typescript
try {
  await sdk.exchange.listNFT(params);
} catch (error) {
  if (error instanceof ZunoSDKError) {
    console.log(error.toUserMessage());
    // "Failed to list NFT (Contract: ERC721NFTExchange) (Method: listNFT)
    //  Suggestion: Ensure the NFT is approved for the marketplace"
  }
}
```

### 🔧 Improvements

- Exported `ZunoContext` for advanced use cases
- Added `ZunoSDK.hasInstance()` to check singleton initialization
- Added `ZunoSDK.resetInstance()` for testing cleanup
- Updated `ZunoContextProviderProps` type exports

### 📦 No Breaking Changes

All changes are additive. Existing code continues to work without modification.

---

## [1.2.0-beta-claude.2](https://github.com/ZunoKit/zuno-marketplace-sdk/compare/v1.2.0-beta-claude.1...v1.2.0-beta-claude.2) (2025-11-28)

### ✨ Features

- add network utilities and constants to ZunoAPIClient ([3cf9b2f](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/3cf9b2fc3957929c74f69aab1a8703ade346d944))

### 🐛 Bug Fixes

- resolve test timeouts and mock issues in unit and integration tests ([30e9e8a](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/30e9e8aa0a4d5651986280792e2e8fa77f5f3e5b))

## [1.2.0-beta-claude.1](https://github.com/ZunoKit/zuno-marketplace-sdk/compare/v1.1.5...v1.2.0-beta-claude.1) (2025-11-27)

### ✨ Features

- setup semantic-release with dynamic config ([10a4e28](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/10a4e289e3a4b0373fa08d45074c1fa778f07241))

### 🐛 Bug Fixes

- disable npm publishing temporarily ([85d60a3](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/85d60a39750a71ca992392e599ae24a83d850a14))
- enable Claude to trigger on PR with [@claude](https://github.com/claude) in description or title ([0a5297e](https://github.com/ZunoKit/zuno-marketplace-sdk/commit/0a5297e4c307ae09e4d019fd30eaea64db5e9823))

# Changelog

All notable changes to the Zuno Marketplace SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.5] - 2025-11-26

### 🔄 Changed - BREAKING CHANGES

- **Unified API endpoint configuration**
  - Removed `abisUrl` configuration option
  - All API calls now use single `apiUrl` endpoint
  - Simplified SDK configuration with single unified endpoint

**Migration Required:** Remove `abisUrl` from your configuration. All services (ABIs, contracts, networks) now use the unified `apiUrl`.

**Before:**

```typescript
const config: ZunoSDKConfig = {
  apiKey: "your-api-key",
  network: "sepolia",
  apiUrl: "https://api.zuno.com/v1",
  abisUrl: "https://abis.zuno.com/api", // ❌ Remove this
};
```

**After:**

```typescript
const config: ZunoSDKConfig = {
  apiKey: "your-api-key",
  network: "sepolia",
  apiUrl: "https://api.zuno.com/v1", // ✅ Single unified endpoint
};
```

### ✨ Added

- **Production-ready Logger System**
  - Structured logging with multiple levels (`debug`, `info`, `warn`, `error`, `none`)
  - Auto-logging for all SDK operations (transactions, errors, module actions)
  - Manual logging via `sdk.logger` for custom messages
  - Configurable output formats: text or JSON
  - Module-specific logging with automatic prefixes
  - Filter logging by module or action
  - Custom logger support (Sentry, Datadog, Winston, etc.)
  - Automatic transaction logging with hash and status
  - Error context with SDK state for debugging
  - Performance-optimized: no-op when disabled

**Usage Examples:**

Auto-logging:

```typescript
const sdk = new ZunoSDK({
  logger: { level: "info" },
});
// SDK automatically logs all operations
```

Manual logging:

```typescript
sdk.logger.info('Custom message', { data: {...} });
```

Custom logger integration:

```typescript
logger: {
  customLogger: {
    error: (msg) => Sentry.captureException(new Error(msg));
  }
}
```

### ⚡️ Improved

- Simplified SDK architecture with single API client
- Reduced configuration complexity
- Better default URL handling
- Enhanced debugging capabilities with structured logging
- Better error tracking with automatic context

### 📝 Documentation

- Updated README with simplified configuration examples
- Removed confusing dual-endpoint setup from examples
- Added comprehensive logging documentation with examples
- Documented all logger configuration options

### 🔧 Deprecated

- `debug: boolean` config option - Use `logger.level = 'debug'` instead (backward compatible)

---

## [1.1.4] - 2025-11-23

### 🔄 Changed - BREAKING CHANGES

- **Standardized transaction response shapes across all modules**
  - All mutation methods now return `{ tx: TransactionReceipt, ...additionalData }`
  - `ExchangeModule.listNFT()` now returns `{ listingId: string; tx: TransactionReceipt }` instead of `TransactionReceipt`
  - `ExchangeModule.buyNFT()` now returns `{ tx: TransactionReceipt }` instead of `TransactionReceipt`
  - `ExchangeModule.batchBuyNFT()` now returns `{ tx: TransactionReceipt }` instead of `TransactionReceipt`
  - `ExchangeModule.cancelListing()` now returns `{ tx: TransactionReceipt }` instead of `TransactionReceipt`
  - `ExchangeModule.batchCancelListing()` now returns `{ tx: TransactionReceipt }` instead of `TransactionReceipt`
  - `AuctionModule.placeBid()` now returns `{ tx: TransactionReceipt }` instead of `TransactionReceipt`
  - `AuctionModule.endAuction()` now returns `{ tx: TransactionReceipt }` instead of `TransactionReceipt`
  - `CollectionModule.mintERC1155()` now returns `{ tx: TransactionReceipt }` instead of `TransactionReceipt`

**Migration Required:** Update all SDK method calls to destructure the response object to access the transaction receipt and additional data.

**Before:**

```typescript
const tx = await sdk.exchange.listNFT({
  /* params */
});
console.log(tx.hash);
```

**After:**

```typescript
const { listingId, tx } = await sdk.exchange.listNFT({
  /* params */
});
console.log(tx.hash);
console.log(listingId); // Now available!
```

### ✨ Added

- **New Query Methods**

  - `ExchangeModule.getActiveListings(page, pageSize)` - Get all active listings with pagination
  - `AuctionModule.getActiveAuctions(page, pageSize)` - Get all active auctions (English & Dutch) with pagination
  - `AuctionModule.getAuctionsBySeller(seller, page, pageSize)` - Get auctions by seller address

- **New Mutation Methods**
  - `ExchangeModule.updateListingPrice(listingId, newPrice, options)` - Update price of an active listing
  - `AuctionModule.cancelAuction(auctionId, options)` - Cancel an auction before it ends

### ⚡️ Improved

- Better response consistency - all mutation methods now return structured objects
- Listing ID extraction from transaction logs for `listNFT()` operations
- Enhanced error handling in auction query methods
- Improved TypeScript type inference for method responses

### 📝 Documentation

- Updated all method JSDoc comments with new return types
- Added comprehensive examples for new query methods
- Documented breaking changes in this changelog

---

## [1.1.3] - 2025-11-23

### 🐛 Fixed

- Move `@tanstack/react-query-devtools` to dependencies instead of devDependencies
- Lazy load devtools to avoid bundling in production builds
- Reduce bundle size by conditionally loading devtools

### ⚡️ Improved

- Optimized production bundle by lazy loading React Query DevTools

---

## [1.1.0] - 2025-11-20

### ✨ Added

- **ZunoContextProvider** - New flexible provider for Wagmi and React Query integration
- Support for custom Wagmi and React Query configurations
- Improved provider architecture for better extensibility

### 🔄 Changed

- Refactored `ZunoProvider` to support flexible Wagmi and React Query integration
- Updated provider structure for better composability

### 📝 Documentation

- Added comprehensive CLAUDE.md guide for AI assistants working on the SDK
- Documented provider usage patterns

---

## [1.0.1] - 2025-11-18

### ✨ Added

- **Runtime validation** for all method parameters
- **Batch operations** support for exchange and collection modules
- **Error recovery mechanisms** for failed transactions
- Comprehensive examples for all SDK features

### ⚡️ Improved

- Enhanced error handling with better error messages
- Added validation helpers for addresses, token IDs, and amounts
- Better TypeScript type safety

### 🐛 Fixed

- Removed failing tests and added global axios mock
- Fixed test setup and configuration

---

## [1.0.0] - 2025-11-15

### 🎉 Initial Stable Release

- **Core SDK modules:**

  - ExchangeModule - NFT marketplace trading operations
  - AuctionModule - English and Dutch auction support
  - CollectionModule - NFT collection creation and minting

- **React Integration:**

  - TanStack Query hooks for all SDK operations
  - Wagmi integration for wallet connection
  - ZunoProvider for context management

- **Contract Registry:**

  - ABI fetching and caching
  - Contract instance management
  - Multi-network support

- **Transaction Management:**

  - Transaction sending and waiting
  - Error handling and recovery
  - Event emission for transaction lifecycle

- **Type Safety:**
  - Comprehensive TypeScript types
  - Strict mode enabled
  - Full type coverage

---

## [1.0.2] - 2025-11-14

### 🔄 Changed - BREAKING CHANGES

- **Standardized parameter naming across all modules**
  - `nftAddress` → `collectionAddress` in `CreateEnglishAuctionParams`
  - `nftAddress` → `collectionAddress` in `CreateDutchAuctionParams`
  - `nftAddress` → `collectionAddress` in `MakeOfferParams`
  - `nftAddress` → `collectionAddress` in `Auction` entity

**Migration Required:** Update all auction and offer method calls to use `collectionAddress` instead of `nftAddress`. See [Migration Guide](./docs/MIGRATION.md) for details.

**Before:**

```typescript
await sdk.auction.createEnglishAuction({
  nftAddress: "0x123...", // ❌ Old
  tokenId: "1",
  startingBid: "1.0",
  duration: 86400,
});
```

**After:**

```typescript
await sdk.auction.createEnglishAuction({
  collectionAddress: "0x123...", // ✅ New
  tokenId: "1",
  startingBid: "1.0",
  duration: 86400,
});
```

### ✨ Added

- **Comprehensive API Documentation**

  - Added `docs/API.md` with complete API reference
  - Detailed parameter descriptions for all methods
  - Error code documentation
  - Code examples for every method
  - Type definitions reference

- **Migration Guide**

  - Added `docs/MIGRATION.md` for upgrading from custom services
  - Step-by-step migration instructions
  - Breaking changes documentation
  - Before/after code examples

- **Enhanced JSDoc Comments**
  - Added comprehensive JSDoc comments to all public methods in AuctionModule
  - Includes parameter descriptions, return types, error codes, and examples
  - Better IDE autocomplete and inline documentation

### 📝 Documentation

- Updated README.md with links to new documentation
- Fixed naming inconsistencies in examples
- Updated all code examples to use `collectionAddress`

### 🐛 Fixed

- Inconsistent parameter naming between Exchange and Auction modules
- Updated entity types to match new parameter names

---

## [0.1.1] - Previous Release

### Added

- Runtime validation
- Batch operations
- Error recovery mechanisms
- Comprehensive examples

---

## Migration Notes

### Upgrading from v0.1.x to Latest

1. **Update auction/offer calls:**

   - Replace `nftAddress` with `collectionAddress` in all auction-related code
   - Replace `nftAddress` with `collectionAddress` in all offer-related code

2. **TypeScript will help:**

   - The TypeScript compiler will show errors at all locations that need updating
   - Fix each error by changing `nftAddress` to `collectionAddress`

3. **Run tests:**
   - Ensure all your tests pass after the migration
   - Update any test fixtures that use the old parameter names

For detailed migration instructions, see [docs/MIGRATION.md](./docs/MIGRATION.md).

---

**Legend:**

- 🔄 Changed - Breaking changes
- ✨ Added - New features
- 📝 Documentation - Documentation updates
- 🐛 Fixed - Bug fixes
- ⚡️ Improved - Performance improvements
- 🔒 Security - Security fixes
