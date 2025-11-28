/**
 * Tree-shakeable Collection module entry point
 * @packageDocumentation
 */

export { CollectionModule } from '../modules/CollectionModule';

// Re-export types related to Collection
export type {
  CreateERC721CollectionParams,
  CreateERC1155CollectionParams,
  MintERC721Params,
  MintERC1155Params,
  BatchMintERC721Params,
} from '../types/contracts';

export type { Collection } from '../types/entities';
