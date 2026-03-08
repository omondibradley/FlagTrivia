using UnityEngine;

[CreateAssetMenu(fileName = "QuestionBank", menuName = "FlagTrivia/Question Bank")]
public class QuestionBank : ScriptableObject
{
    public FlagQuestion[] questions;
}
