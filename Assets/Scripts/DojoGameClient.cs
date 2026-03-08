using UnityEngine;
using Dojo;
using Dojo.Starknet;
using Dojo.Torii;
using dojo_bindings;
using System.Threading.Tasks;
using System;
using System.Collections.Generic;

public class DojoGameClient : MonoBehaviour
{
    [Header("Dojo References")]
    public WorldManager worldManager;

    [Header("Config")]
    public string rpcUrl = "http://localhost:5050";
    public string masterAddress = "0x127fd5f1fe78a71f8bcd1fec63e3fe2f0486b6ecd5c86a0466c3a21fa5cfcec";
    public string masterPrivateKey = "0xc5b2fcab997346f3ea1c00b002ecf6f382c5f9c9659a3894eb783c5320f912";
    public string actionsAddress = ""; // We'll fill this from the manifest

    private Account burnerAccount;
    private bool isConnected = false;

    public bool IsConnected => isConnected;

    public struct LeaderboardData
    {
        public string player;
        public uint score;
        public byte correctCount;
        public byte totalQuestions;
    }

    public async Task<bool> Connect()
    {
        try
        {
            var provider = new JsonRpcClient(rpcUrl);
            var signer = new SigningKey(masterPrivateKey);
            var masterAccount = new Account(provider, signer, new FieldElement(masterAddress));

            BurnerManager burnerManager = new BurnerManager(provider, masterAccount);
            burnerAccount = await burnerManager.DeployBurner();

            isConnected = true;
            Debug.Log("Dojo connected! Burner account deployed.");
            Debug.Log($"Burner address: {burnerAccount.Address.Hex()}");
            return true;
        }
        catch (Exception e)
        {
            Debug.LogError($"Dojo connection failed: {e.Message}");
            isConnected = false;
            return false;
        }
    }

    public async Task<bool> CallStartGame(uint sessionId)
    {
        if (!isConnected)
        {
            Debug.LogWarning("Not connected to Dojo");
            return false;
        }

        try
        {
            var call = new dojo.Call
            {
                to = new FieldElement(actionsAddress).Inner,
                selector = "start_game",
                calldata = new dojo.FieldElement[] { new FieldElement(sessionId).Inner }
            };

            await burnerAccount.ExecuteRaw(new dojo.Call[] { call });
            Debug.Log($"start_game called with session {sessionId}");
            return true;
        }
        catch (Exception e)
        {
            Debug.LogError($"start_game failed: {e.Message}");
            return false;
        }
    }

    public async Task<bool> CallSubmitAnswer(uint sessionId, byte answerIndex)
    {
        if (!isConnected)
        {
            Debug.LogWarning("Not connected to Dojo");
            return false;
        }

        try
        {
            var call = new dojo.Call
            {
                to = new FieldElement(actionsAddress).Inner,
                selector = "submit_answer",
                calldata = new dojo.FieldElement[]
                {
                    new FieldElement(sessionId).Inner,
                    new FieldElement(answerIndex).Inner
                }
            };

            await burnerAccount.ExecuteRaw(new dojo.Call[] { call });
            Debug.Log($"submit_answer called: session={sessionId}, answer={answerIndex}");
            return true;
        }
        catch (Exception e)
        {
            Debug.LogError($"submit_answer failed: {e.Message}");
            return false;
        }
    }

    public async Task<List<LeaderboardData>> FetchLeaderboardEntries()
    {
        var results = new List<LeaderboardData>();
        try
        {
            Debug.Log($"worldManager={worldManager != null}, toriiClient={worldManager?.toriiClient != null}");
            var query = new Query(pagination: new Pagination(limit: 1000), models: new[] { "flag_trivia-LeaderboardEntry" });
            var page = await Task.Run(() => worldManager.toriiClient.Entities(query));
            Debug.Log($"page={page != null}, items={page?.items?.Length.ToString() ?? "null"}");

            foreach (var entity in page.items ?? new Dojo.Torii.Entity[0])
            {
                if (!entity.Models.TryGetValue("flag_trivia-LeaderboardEntry", out var model)) continue;

                results.Add(new LeaderboardData
                {
                    player = ((FieldElement)model.Members["player"]).ToString(),
                    score = (uint)model.Members["score"],
                    correctCount = (byte)model.Members["correct_count"],
                    totalQuestions = (byte)model.Members["total_questions"]
                });
            }

            results.Sort((a, b) => b.score.CompareTo(a.score));
        }
        catch (Exception e)
        {
            Debug.LogError($"FetchLeaderboardEntries failed: {e.Message}\n{e.StackTrace}");
        }
        return results;
    }
}