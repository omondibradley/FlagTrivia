using UnityEngine;

[System.Serializable]
public class FlagQuestion
{
    public int questionId;        // Must match on-chain question_id
    public Sprite flagSprite;     // The flag image
    public string countryName;    // The correct country name
}