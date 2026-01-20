<?php

namespace App\Http\Controllers\Api;

use App\Models\Game;
use App\Models\GameProgress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class ProgressController extends Controller
{
    /**
     * Load saved progress for a user + game
     * GET /api/v1/progress/{gameUuid}?user_uuid=xxx
     */
    public function load(Request $request, string $gameUuid): JsonResponse
    {
        $userUuid = $request->query('user_uuid');

        if (!$userUuid) {
            return response()->json([
                'status' => 'error',
                'message' => 'user_uuid is required',
            ], 400);
        }

        $game = Game::where('uuid', $gameUuid)->first();

        if (!$game) {
            return response()->json([
                'status' => 'error',
                'message' => 'Game not found',
            ], 404);
        }

        $progress = GameProgress::where('user_uuid', $userUuid)
            ->where('game_id', $game->id)
            ->first();

        if (!$progress) {
            // Return default progress for new players
            return response()->json([
                'status' => 'success',
                'data' => [
                    'current_level' => 1,
                    'high_score' => 0,
                    'total_score' => 0,
                    'state' => null,
                    'play_count' => 0,
                    'total_time_ms' => 0,
                    'last_played_at' => null,
                ],
            ]);
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'current_level' => $progress->current_level,
                'high_score' => $progress->high_score,
                'total_score' => $progress->total_score,
                'state' => $progress->state,
                'play_count' => $progress->play_count,
                'total_time_ms' => $progress->total_time_ms,
                'last_played_at' => $progress->last_played_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * Save progress for a user + game
     * POST /api/v1/progress/save
     */
    public function save(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_uuid' => 'required|string|max:64',
            'game_uuid' => 'required|string|max:64',
            'level' => 'integer|min:1',
            'score' => 'integer|min:0',
            'state' => 'nullable|array',
            'duration_ms' => 'integer|min:0',
        ]);

        $game = Game::where('uuid', $validated['game_uuid'])->first();

        if (!$game) {
            return response()->json([
                'status' => 'error',
                'message' => 'Game not found',
            ], 404);
        }

        $progress = GameProgress::getOrCreate($validated['user_uuid'], $game->id);

        $progress->updateFromSession(
            $validated['level'] ?? 1,
            $validated['score'] ?? 0,
            $validated['state'] ?? null,
            $validated['duration_ms'] ?? 0
        );

        return response()->json([
            'status' => 'success',
            'data' => [
                'current_level' => $progress->current_level,
                'high_score' => $progress->high_score,
                'total_score' => $progress->total_score,
                'play_count' => $progress->play_count,
            ],
        ]);
    }

    /**
     * Batch save progress for multiple games (sync queue)
     * POST /api/v1/progress/batch
     */
    public function batch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_uuid' => 'required|string|max:64',
            'progress' => 'required|array',
            'progress.*.game_uuid' => 'required|string|max:64',
            'progress.*.level' => 'integer|min:1',
            'progress.*.score' => 'integer|min:0',
            'progress.*.state' => 'nullable|array',
            'progress.*.duration_ms' => 'integer|min:0',
        ]);

        $results = [];
        $gameUuids = collect($validated['progress'])->pluck('game_uuid')->unique();
        $games = Game::whereIn('uuid', $gameUuids)->get()->keyBy('uuid');

        foreach ($validated['progress'] as $item) {
            $game = $games->get($item['game_uuid']);
            if (!$game) {
                $results[] = ['game_uuid' => $item['game_uuid'], 'status' => 'error', 'message' => 'Game not found'];
                continue;
            }

            $progress = GameProgress::getOrCreate($validated['user_uuid'], $game->id);
            $progress->updateFromSession(
                $item['level'] ?? 1,
                $item['score'] ?? 0,
                $item['state'] ?? null,
                $item['duration_ms'] ?? 0
            );

            $results[] = ['game_uuid' => $item['game_uuid'], 'status' => 'success', 'high_score' => $progress->high_score];
        }

        return response()->json([
            'status' => 'success',
            'data' => $results,
        ]);
    }
}
