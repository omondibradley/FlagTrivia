using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections.Generic;

public class GameManager : MonoBehaviour
{
    public enum GameState { Menu, Playing, Results, Leaderboard }

    [Header("Panels")]
    public GameObject menuPanel;
    public GameObject gamePanel;
    public GameObject resultsPanel;
    public GameObject leaderboardPanel;

    [Header("Data")]
    public QuestionBank questionBank;

    [Header("Menu UI")]
    public Button startButton;
    public Button leaderboardButton;
    public Button connectButton;
    public TMP_Text playerNameText;

    [Header("Game UI")]
    public Image flagImage;
    public Button[] answerButtons;
    public TMP_Text[] answerTexts;
    public Slider timerSlider;
    public TMP_Text scoreText;
    public TMP_Text questionCounterText;
    public TMP_Text feedbackText;

    [Header("Results UI")]
    public TMP_Text finalScoreText;
    public TMP_Text correctCountText;
    public Button playAgainButton;
    public Button resultsLeaderboardButton;

    [Header("Leaderboard UI")]
    public Transform leaderboardContent;
    public GameObject leaderboardRowPrefab;
    public Button backButton;

    [Header("Settings")]
    public float timePerQuestion = 10f;
    public int questionsPerGame = 10;
    public Color correctColor = new Color(0.13f, 0.67f, 0.27f);
    public Color wrongColor = new Color(0.67f, 0.13f, 0.27f);
    public Color defaultButtonColor = new Color(0.1f, 0.1f, 0.23f);

    [Header("Dojo")]
    public DojoGameClient dojoClient;

    private GameState currentState;
    private List<FlagQuestion> currentQuestions;
    private int currentQuestionIndex;
    private int currentCorrectButton;
    private int score;
    private int correctCount;
    private float timeLeft;
    private bool canAnswer;
    private int[] shuffledOptionIndices = new int[4];
    private uint sessionId;

    void Start()
    {
        startButton.onClick.AddListener(OnStartGame);
        leaderboardButton.onClick.AddListener(OnShowLeaderboard);
        playAgainButton.onClick.AddListener(OnStartGame);
        resultsLeaderboardButton.onClick.AddListener(OnShowLeaderboard);
        backButton.onClick.AddListener(OnBackToMenu);
        if (connectButton != null)
            connectButton.onClick.AddListener(OnConnectWallet);

        for (int i = 0; i < answerButtons.Length; i++)
        {
            int index = i;
            answerButtons[i].onClick.AddListener(() => OnAnswerSelected(index));
        }

        SetState(GameState.Menu);
        UpdateConnectionUI();
    }

    async void OnConnectWallet()
    {
        if (connectButton != null) connectButton.interactable = false;
        if (playerNameText != null) playerNameText.text = "Connecting...";

        bool success = dojoClient != null && await dojoClient.Connect();

        UpdateConnectionUI();
        if (connectButton != null) connectButton.interactable = !success;
    }

    void UpdateConnectionUI()
    {
        bool connected = dojoClient != null && dojoClient.IsConnected;

        if (playerNameText != null)
            playerNameText.text = connected ? $"Connected as: {dojoClient.PlayerName}" : "";

        if (connectButton != null)
            connectButton.gameObject.SetActive(!connected);
    }

    void Update()
    {
        if (currentState != GameState.Playing || !canAnswer) return;

        timeLeft -= Time.deltaTime;
        float fraction = Mathf.Clamp01(timeLeft / timePerQuestion);
        timerSlider.value = fraction;

        Image fill = timerSlider.fillRect.GetComponent<Image>();
        if (fraction < 0.25f)
            fill.color = new Color(1f, 0.2f, 0.27f);
        else if (fraction < 0.5f)
            fill.color = new Color(1f, 0.67f, 0.13f);
        else
            fill.color = new Color(0.27f, 0.67f, 1f);

        if (timeLeft <= 0f)
        {
            canAnswer = false;
            ShowFeedback("TIME UP!", wrongColor);
            Invoke(nameof(NextQuestion), 1.5f);
        }
    }

    void SetState(GameState newState)
    {
        currentState = newState;
        menuPanel.SetActive(newState == GameState.Menu);
        gamePanel.SetActive(newState == GameState.Playing);
        resultsPanel.SetActive(newState == GameState.Results);
        leaderboardPanel.SetActive(newState == GameState.Leaderboard);
    }

    void OnStartGame()
    {
        currentQuestions = new List<FlagQuestion>(questionBank.questions);
        ShuffleList(currentQuestions);
        if (currentQuestions.Count > questionsPerGame)
            currentQuestions = currentQuestions.GetRange(0, questionsPerGame);

        currentQuestionIndex = 0;
        score = 0;
        correctCount = 0;
        sessionId = (uint)Random.Range(1, 999999);

        // Fire and forget — don't block the UI
        if (dojoClient != null && dojoClient.IsConnected)
            _ = dojoClient.CallStartGame(sessionId);

        SetState(GameState.Playing);
        ShowQuestion();
    }

    async void OnShowLeaderboard()
    {
        SetState(GameState.Leaderboard);

        foreach (Transform child in leaderboardContent)
            Destroy(child.gameObject);

        if (dojoClient == null || !dojoClient.IsConnected) return;

        var entries = await dojoClient.FetchLeaderboardEntries();
        Debug.Log($"Leaderboard entries: {entries.Count}, prefab={leaderboardRowPrefab != null}, content={leaderboardContent != null}");
        for (int i = 0; i < entries.Count; i++)
        {
            var row = Instantiate(leaderboardRowPrefab, leaderboardContent);
            row.GetComponent<LeaderboardRow>().SetData(
                i + 1,
                entries[i].player,
                entries[i].score,
                entries[i].correctCount,
                entries[i].totalQuestions
            );
        }
    }

    void OnBackToMenu()
    {
        SetState(GameState.Menu);
    }

    void ShowQuestion()
    {
        if (currentQuestionIndex >= currentQuestions.Count)
        {
            EndGame();
            return;
        }

        FlagQuestion q = currentQuestions[currentQuestionIndex];
        canAnswer = true;
        timeLeft = timePerQuestion;

        flagImage.sprite = q.flagSprite;

        // Build wrong options from other countries in the bank
        List<string> wrongPool = new List<string>();
        foreach (FlagQuestion other in questionBank.questions)
        {
            if (other.countryName != q.countryName)
                wrongPool.Add(other.countryName);
        }
        ShuffleList(wrongPool);

        // Place correct answer at a random position
        int correctSlot = Random.Range(0, 4);
        string[] displayOptions = new string[4];
        int wrongIdx = 0;
        for (int i = 0; i < 4; i++)
        {
            if (i == correctSlot)
                displayOptions[i] = q.countryName;
            else
            {
                displayOptions[i] = wrongPool[wrongIdx];
                wrongIdx++;
            }
        }

        // Store which button index is correct for answer checking
        currentCorrectButton = correctSlot;

        for (int i = 0; i < 4; i++)
        {
            answerTexts[i].text = displayOptions[i];
            answerButtons[i].image.color = defaultButtonColor;
            answerButtons[i].interactable = true;
        }

        scoreText.text = $"Score: {score}";
        questionCounterText.text = $"{currentQuestionIndex + 1}/{currentQuestions.Count}";
        feedbackText.gameObject.SetActive(false);

        timerSlider.value = 1f;
        timerSlider.fillRect.GetComponent<Image>().color = new Color(0.27f, 0.67f, 1f);

        flagImage.transform.localScale = Vector3.zero;
        LeanTween.scale(flagImage.gameObject, Vector3.one, 0.3f)
            .setEase(LeanTweenType.easeOutBack);
    }

    void OnAnswerSelected(int buttonIndex)
    {
        if (!canAnswer) return;
        canAnswer = false;

        FlagQuestion q = currentQuestions[currentQuestionIndex];
        bool isCorrect = buttonIndex == currentCorrectButton;

        if (isCorrect)
        {
            int timeBonus = Mathf.FloorToInt(timeLeft * 10f);
            int earned = 100 + timeBonus;
            score += earned;
            correctCount++;

            answerButtons[buttonIndex].image.color = correctColor;
            ShowFeedback($"CORRECT! +{earned}", correctColor);
        }
        else
        {
            answerButtons[buttonIndex].image.color = wrongColor;
            answerButtons[currentCorrectButton].image.color = correctColor;
            ShowFeedback("WRONG!", wrongColor);
        }

        foreach (Button btn in answerButtons)
            btn.interactable = false;

        if (dojoClient != null && dojoClient.IsConnected)
        {
            byte onChainAnswer = isCorrect ? (byte)0 : (byte)1;
            _ = dojoClient.CallSubmitAnswer(sessionId, onChainAnswer);
        }

        Invoke(nameof(NextQuestion), 1.5f);
    }

    void ShowFeedback(string message, Color color)
    {
        feedbackText.gameObject.SetActive(true);
        feedbackText.text = message;
        feedbackText.color = color;

        feedbackText.transform.localScale = Vector3.one * 0.5f;
        LeanTween.scale(feedbackText.gameObject, Vector3.one, 0.2f)
            .setEase(LeanTweenType.easeOutBack);
    }

    void NextQuestion()
    {
        currentQuestionIndex++;
        ShowQuestion();
    }

    void EndGame()
    {
        SetState(GameState.Results);

        finalScoreText.text = "0";
        LeanTween.value(gameObject, 0f, score, 1.5f)
            .setEase(LeanTweenType.easeOutQuart)
            .setOnUpdate((float val) =>
            {
                finalScoreText.text = Mathf.FloorToInt(val).ToString();
            });

        correctCountText.text = $"{correctCount} / {currentQuestions.Count} correct";
    }

    void ShuffleList<T>(List<T> list)
    {
        for (int i = list.Count - 1; i > 0; i--)
        {
            int j = Random.Range(0, i + 1);
            T temp = list[i];
            list[i] = list[j];
            list[j] = temp;
        }
    }
}