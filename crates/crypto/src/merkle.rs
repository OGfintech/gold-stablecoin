use crate::hash::sha256_multi;
use gold_core::Hash;

/// Merkle tree for efficient verification
#[derive(Debug, Clone)]
pub struct MerkleTree {
    /// All nodes in the tree (leaves first, then internal nodes, root last)
    nodes: Vec<Hash>,
    /// Number of leaves
    leaf_count: usize,
}

impl MerkleTree {
    /// Build a Merkle tree from leaf hashes
    pub fn from_leaves(leaves: Vec<Hash>) -> Self {
        if leaves.is_empty() {
            return Self {
                nodes: vec![[0u8; 32]],
                leaf_count: 0,
            };
        }

        let leaf_count = leaves.len();
        let mut nodes = leaves;

        // Build tree level by level
        let mut level_start = 0;
        let mut level_size = leaf_count;

        while level_size > 1 {
            let next_level_size = (level_size + 1) / 2;

            for i in 0..next_level_size {
                let left_idx = level_start + i * 2;
                let right_idx = if i * 2 + 1 < level_size {
                    level_start + i * 2 + 1
                } else {
                    left_idx // Duplicate if odd
                };

                let parent = sha256_multi(&[&nodes[left_idx], &nodes[right_idx]]);
                nodes.push(parent);
            }

            level_start += level_size;
            level_size = next_level_size;
        }

        Self { nodes, leaf_count }
    }

    /// Get the Merkle root
    pub fn root(&self) -> Hash {
        *self.nodes.last().unwrap_or(&[0u8; 32])
    }

    /// Get number of leaves
    pub fn leaf_count(&self) -> usize {
        self.leaf_count
    }

    /// Generate a Merkle proof for a leaf at given index
    pub fn proof(&self, index: usize) -> Option<MerkleProof> {
        if index >= self.leaf_count {
            return None;
        }

        let mut proof_hashes = Vec::new();
        let mut proof_positions = Vec::new();

        let mut current_idx = index;
        let mut level_start = 0;
        let mut level_size = self.leaf_count;

        while level_size > 1 {
            let sibling_idx = if current_idx % 2 == 0 {
                if current_idx + 1 < level_size {
                    current_idx + 1
                } else {
                    current_idx
                }
            } else {
                current_idx - 1
            };

            proof_hashes.push(self.nodes[level_start + sibling_idx]);
            proof_positions.push(current_idx % 2 == 1); // true if sibling is on left

            level_start += level_size;
            level_size = (level_size + 1) / 2;
            current_idx /= 2;
        }

        Some(MerkleProof {
            leaf: self.nodes[index],
            proof_hashes,
            proof_positions,
        })
    }

    /// Verify a leaf is in the tree
    pub fn verify(&self, index: usize, leaf: &Hash) -> bool {
        if index >= self.leaf_count {
            return false;
        }

        if &self.nodes[index] != leaf {
            return false;
        }

        if let Some(proof) = self.proof(index) {
            proof.verify(&self.root())
        } else {
            false
        }
    }
}

/// Merkle proof for a single leaf
#[derive(Debug, Clone)]
pub struct MerkleProof {
    pub leaf: Hash,
    pub proof_hashes: Vec<Hash>,
    pub proof_positions: Vec<bool>, // true if sibling is on left
}

impl MerkleProof {
    /// Verify the proof against a root
    pub fn verify(&self, root: &Hash) -> bool {
        let mut current = self.leaf;

        for (hash, is_left) in self.proof_hashes.iter().zip(&self.proof_positions) {
            current = if *is_left {
                sha256_multi(&[hash, &current])
            } else {
                sha256_multi(&[&current, hash])
            };
        }

        &current == root
    }

    /// Compute the root from the proof
    pub fn compute_root(&self) -> Hash {
        let mut current = self.leaf;

        for (hash, is_left) in self.proof_hashes.iter().zip(&self.proof_positions) {
            current = if *is_left {
                sha256_multi(&[hash, &current])
            } else {
                sha256_multi(&[&current, hash])
            };
        }

        current
    }
}

/// Compute Merkle root directly from hashes (more efficient if only root is needed)
pub fn compute_merkle_root(hashes: &[Hash]) -> Hash {
    if hashes.is_empty() {
        return [0u8; 32];
    }

    if hashes.len() == 1 {
        return hashes[0];
    }

    let mut current_level: Vec<Hash> = hashes.to_vec();

    while current_level.len() > 1 {
        let mut next_level = Vec::with_capacity((current_level.len() + 1) / 2);

        for chunk in current_level.chunks(2) {
            let parent = if chunk.len() == 2 {
                sha256_multi(&[&chunk[0], &chunk[1]])
            } else {
                sha256_multi(&[&chunk[0], &chunk[0]])
            };
            next_level.push(parent);
        }

        current_level = next_level;
    }

    current_level[0]
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::hash::sha256;

    #[test]
    fn test_merkle_empty() {
        let tree = MerkleTree::from_leaves(vec![]);
        assert_eq!(tree.root(), [0u8; 32]);
        assert_eq!(tree.leaf_count(), 0);
    }

    #[test]
    fn test_merkle_single() {
        let leaf = sha256(b"leaf");
        let tree = MerkleTree::from_leaves(vec![leaf]);

        assert_eq!(tree.root(), leaf);
        assert_eq!(tree.leaf_count(), 1);
    }

    #[test]
    fn test_merkle_two() {
        let leaf1 = sha256(b"leaf1");
        let leaf2 = sha256(b"leaf2");
        let tree = MerkleTree::from_leaves(vec![leaf1, leaf2]);

        let expected_root = sha256_multi(&[&leaf1, &leaf2]);
        assert_eq!(tree.root(), expected_root);
    }

    #[test]
    fn test_merkle_four() {
        let leaves: Vec<Hash> = (0..4).map(|i| sha256(format!("leaf{}", i).as_bytes())).collect();
        let tree = MerkleTree::from_leaves(leaves.clone());

        assert_eq!(tree.leaf_count(), 4);
        assert!(tree.verify(0, &leaves[0]));
        assert!(tree.verify(1, &leaves[1]));
        assert!(tree.verify(2, &leaves[2]));
        assert!(tree.verify(3, &leaves[3]));
    }

    #[test]
    fn test_merkle_odd() {
        let leaves: Vec<Hash> = (0..5).map(|i| sha256(format!("leaf{}", i).as_bytes())).collect();
        let tree = MerkleTree::from_leaves(leaves.clone());

        assert_eq!(tree.leaf_count(), 5);
        for (i, leaf) in leaves.iter().enumerate() {
            assert!(tree.verify(i, leaf));
        }
    }

    #[test]
    fn test_merkle_proof() {
        let leaves: Vec<Hash> = (0..8).map(|i| sha256(format!("leaf{}", i).as_bytes())).collect();
        let tree = MerkleTree::from_leaves(leaves.clone());

        for i in 0..8 {
            let proof = tree.proof(i).unwrap();
            assert!(proof.verify(&tree.root()));
            assert_eq!(proof.compute_root(), tree.root());
        }
    }

    #[test]
    fn test_invalid_proof() {
        let leaves: Vec<Hash> = (0..4).map(|i| sha256(format!("leaf{}", i).as_bytes())).collect();
        let tree = MerkleTree::from_leaves(leaves);

        let wrong_leaf = sha256(b"wrong");
        assert!(!tree.verify(0, &wrong_leaf));
    }

    #[test]
    fn test_compute_merkle_root() {
        let leaves: Vec<Hash> = (0..8).map(|i| sha256(format!("leaf{}", i).as_bytes())).collect();

        let tree = MerkleTree::from_leaves(leaves.clone());
        let direct_root = compute_merkle_root(&leaves);

        assert_eq!(tree.root(), direct_root);
    }

    #[test]
    fn test_merkle_deterministic() {
        let leaves: Vec<Hash> = (0..10).map(|i| sha256(format!("leaf{}", i).as_bytes())).collect();

        let tree1 = MerkleTree::from_leaves(leaves.clone());
        let tree2 = MerkleTree::from_leaves(leaves);

        assert_eq!(tree1.root(), tree2.root());
    }
}
