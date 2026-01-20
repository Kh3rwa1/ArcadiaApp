<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Game;
use Illuminate\Http\Request;

class FeedController extends Controller
{
    /**
     * Vertical Swipe Feed
     * Returns a paginated list of games with their latest version URLs.
     */
    public function index(Request $request)
    {
        $query = Game::with(['latestVersion'])
            ->where('is_active', true)
            ->whereHas('latestVersion', function ($q) {
                $q->where('is_published', true)->where('is_healthy', true);
            });

        // Filter by category or daily if requested
        if ($request->has('category')) {
            $query->whereJsonContains('settings->categories', $request->category);
        }

        $games = $query->latest()->cursorPaginate(15);

        return response()->json([
            'status' => 'success',
            'data' => $games->through(function ($game) use ($request) {
                return [
                    'id' => $game->uuid,
                    'title' => $game->title,
                    'description' => $game->description,
                    'thumbnail' => $game->thumbnail_url,
                    'game_url' => $game->latestVersion ? '/' . $game->latestVersion->folder_path . '/' . $game->latestVersion->entry_point : null,
                    'version' => $game->latestVersion->version_tag ?? 'N/A',
                    'settings' => $game->settings ?? (object)[],
                    'is_daily' => $request->has('daily'),
                ];
            })
        ]);
    }

    /**
     * Get Daily Drop & Challenge
     */
    public function daily()
    {
        // For now, return a deterministic "Daily Drop" based on date
        $game = Game::where('is_active', true)->first();
        
        return response()->json([
            'status' => 'success',
            'drop' => [
                'game_id' => $game->uuid ?? null,
                'title' => $game->title ?? 'Arcadia Daily',
            ],
            'challenge' => [
                'game_id' => $game->uuid ?? null,
                'seed' => date('Ymd'), // Fixed seed for 24h
                'target_score' => 5000
            ]
        ]);
    }
}
