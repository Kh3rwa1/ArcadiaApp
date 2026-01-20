<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\GameAnalytic;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AnalyticsController extends Controller
{
    /**
     * Track user interactions with games.
     */
    public function track(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'game_uuid' => 'required|exists:games,uuid',
            'user_uuid' => 'required|string',
            'event_type' => 'required|in:impression,start,end,completion,score_update,crash',
            'duration_ms' => 'nullable|integer',
            'metadata' => 'nullable|array'
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 422);
        }

        $game = Game::where('uuid', $request->game_uuid)->firstOrFail();

        // 1. Log basic analytic
        GameAnalytic::create([
            'game_id' => $game->id,
            'user_uuid' => $request->user_uuid,
            'event_type' => $request->event_type,
            'duration_ms' => $request->duration_ms ?? 0,
            'metadata' => $request->metadata
        ]);

        // 2. If it's a score, compute percentile
        if ($request->event_type === 'score_update' && isset($request->metadata['score'])) {
            $score = (int)$request->metadata['score'];
            
            // Push to game_scores table
            \DB::table('game_scores')->insert([
                'game_id' => $game->id,
                'user_uuid' => $request->user_uuid,
                'score' => $score,
                'created_at' => now()
            ]);

            // Compute Quantile: (Better Than / Total) * 100
            $total = \DB::table('game_scores')->where('game_id', $game->id)->count();
            $betterThan = \DB::table('game_scores')->where('game_id', $game->id)->where('score', '<', $score)->count();
            
            $percentile = $total > 0 ? floor(($betterThan / $total) * 100) : 100;

            return response()->json([
                'status' => 'logged',
                'percentile' => 100 - $percentile // "Top 5%" instead of 95th percentile
            ]);
        }

        return response()->json(['status' => 'logged']);
    }

    /**
     * Batch log events (common in mobile apps to save battery/network)
     */
    public function batchTrack(Request $request)
    {
        // logic for batch inserts
    }
}
