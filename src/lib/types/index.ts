export type BlockType = 'paragraph' | 'h1' | 'h2';

export interface Block {
	id: string;
	type: BlockType;
	content: string;
}
