use flag_trivia::models::{Question, GameSession, LeaderboardEntry};

#[starknet::interface]
pub trait IActions<T> {
    fn seed_question(ref self: T, question_id: u32, correct_answer_index: u8, base_points: u32);
    fn start_game(ref self: T, session_id: u32);
    fn submit_answer(ref self: T, session_id: u32, answer_index: u8);
}

#[dojo::contract]
pub mod actions {
    use dojo::model::ModelStorage;
    use starknet::{get_caller_address, get_block_timestamp};
    use core::poseidon::poseidon_hash_span;
    use super::{IActions, Question, GameSession, LeaderboardEntry};

    const TOTAL_QUESTIONS: u8 = 10;
    const TIME_PER_QUESTION: u64 = 10;
    const ANSWER_SALT: felt252 = 'FLAG_TRIVIA_2025';

    #[abi(embed_v0)]
    impl ActionsImpl of IActions<ContractState> {

        fn seed_question(
            ref self: ContractState,
            question_id: u32,
            correct_answer_index: u8,
            base_points: u32,
        ) {
            let mut world = self.world_default();

            assert!(correct_answer_index <= 3, "Invalid answer index");

            let answer_hash = poseidon_hash_span(
                array![
                    correct_answer_index.into(),
                    question_id.into(),
                    ANSWER_SALT,
                ].span()
            );

            let question = Question {
                question_id,
                answer_hash,
                base_points,
            };

            world.write_model(@question);
        }

        // Player passes in their own session_id (client generates a random number)
        fn start_game(ref self: ContractState, session_id: u32) {
            let mut world = self.world_default();
            let player = get_caller_address();
            let now = get_block_timestamp();

            let session = GameSession {
                player,
                session_id,
                current_question_idx: 0,
                total_questions: TOTAL_QUESTIONS,
                score: 0,
                correct_count: 0,
                started_at: now,
                question_started_at: now,
                is_active: true,
            };

            world.write_model(@session);
        }

        fn submit_answer(
            ref self: ContractState,
            session_id: u32,
            answer_index: u8,
        ) {
            let mut world = self.world_default();
            let player = get_caller_address();
            let now = get_block_timestamp();

            let mut session: GameSession = world.read_model((player, session_id));

            assert!(session.is_active, "Game is not active");
            assert!(answer_index <= 3, "Invalid answer index");

            let deadline = session.question_started_at + TIME_PER_QUESTION;
            assert!(now <= deadline, "Time expired");

            let question_id: u32 = session.current_question_idx.into() + 1;
            let question: Question = world.read_model(question_id);

            let computed_hash = poseidon_hash_span(
                array![
                    answer_index.into(),
                    question_id.into(),
                    ANSWER_SALT,
                ].span()
            );

            if computed_hash == question.answer_hash {
                let time_taken = now - session.question_started_at;
                let time_remaining = TIME_PER_QUESTION - time_taken;
                let time_bonus: u32 = (time_remaining * 10).try_into().unwrap();
                session.score += question.base_points + time_bonus;
                session.correct_count += 1;
            }

            session.current_question_idx += 1;
            session.question_started_at = now;

            if session.current_question_idx >= session.total_questions {
                session.is_active = false;

                let entry = LeaderboardEntry {
                    player,
                    session_id,
                    score: session.score,
                    correct_count: session.correct_count,
                    total_questions: session.total_questions,
                    completed_at: now,
                };
                world.write_model(@entry);
            }

            world.write_model(@session);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"flag_trivia")
        }
    }
}
