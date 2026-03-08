use starknet::ContractAddress;

// A question's answer hash, stored on-chain at seed time.
// The actual question text and flag images live in the Unity client.
#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct Question {
    #[key]
    pub question_id: u32,
    // Poseidon hash of: (correct_answer_index, question_id, SALT)
    pub answer_hash: felt252,
    // Points for a correct answer (before time bonus)
    pub base_points: u32,
}

// Tracks one player's active game session
#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct GameSession {
    #[key]
    pub player: ContractAddress,
    #[key]
    pub session_id: u32,
    pub current_question_idx: u8,
    pub total_questions: u8,
    pub score: u32,
    pub correct_count: u8,
    pub started_at: u64,
    pub question_started_at: u64,
    pub is_active: bool,
}

// Written once when a game session completes
#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct LeaderboardEntry {
    #[key]
    pub player: ContractAddress,
    #[key]
    pub session_id: u32,
    pub score: u32,
    pub correct_count: u8,
    pub total_questions: u8,
    pub completed_at: u64,
}
