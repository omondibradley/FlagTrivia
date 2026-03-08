using UnityEngine;
using TMPro;

public class LeaderboardRow : MonoBehaviour
{
    public TMP_Text rankText;
    public TMP_Text playerText;
    public TMP_Text scoreText;
    public TMP_Text correctCountText;

    public void SetData(int rank, string playerAddress, uint score, byte correctCount, byte totalQuestions)
    {
        rankText.text = $"#{rank}";
        playerText.text = playerAddress.Length > 10
            ? playerAddress[..6] + "..." + playerAddress[^4..]
            : playerAddress;
        scoreText.text = score.ToString();
        correctCountText.text = $"{correctCount}/{totalQuestions}";
    }
}
