<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Services\GameDeploymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GameController extends Controller
{
    protected $deploymentService;

    public function __construct(GameDeploymentService $deploymentService)
    {
        $this->deploymentService = $deploymentService;
    }

    public function index()
    {
        $games = Game::with(['latestVersion'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($game) {
                return [
                    'id' => $game->uuid,
                    'title' => $game->title,
                    'status' => $game->is_active ? 'live' : 'hidden',
                    'sessions' => number_format($game->plays_count ?? 0),
                    'retention' => '+0%', // Placeholder for now
                    'avgTime' => '0:00',   // Placeholder for now
                    'version' => $game->latestVersion?->version_tag ?? 'v0.0.0',
                    'url' => $game->latestVersion?->deployment_url ?? '#'
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $games
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'nullable|string|in:game,utility,tool,social',
            'category' => 'nullable|string',
            'config' => 'nullable|array',
            'game_zip' => 'required|file|mimes:zip|max:51200', // 50MB limit
            'version_tag' => 'required|string',
            'thumbnail' => 'nullable|image|max:2048'
        ]);

        return DB::transaction(function () use ($request) {
            $game = Game::firstOrCreate(
                ['slug' => Str::slug($request->title)],
                [
                    'title' => $request->title,
                    'description' => $request->description,
                    'type' => $request->type ?? 'game',
                    'category' => $request->category,
                    'config' => $request->config
                ]
            );

            if ($request->hasFile('thumbnail')) {
                $path = $request->file('thumbnail')->store("games/{$game->uuid}/metadata", 'public', 'public');
                $game->update(['thumbnail_url' => asset('storage/' . $path)]);
            }

            $version = $this->deploymentService->deploy(
                $game,
                $request->file('game_zip'),
                $request->version_tag
            );

            return response()->json([
                'status' => 'success',
                'game' => $game->load('latestVersion'),
                'version' => $version
            ]);
        });
    }

    /**
     * Update game status (Publish/Hide)
     */
    public function updateStatus(Request $request, Game $game)
    {
        $request->validate(['is_active' => 'required|boolean']);
        $game->update(['is_active' => $request->is_active]);
        
        return response()->json(['status' => 'success', 'is_active' => $game->is_active]);
    }

    /**
     * Feature/Unfeature game via settings
     */
    public function toggleFeatured(Request $request, Game $game)
    {
        $settings = $game->settings ?? [];
        $settings['is_featured'] = !($settings['is_featured'] ?? false);
        $game->update(['settings' => $settings]);

        return response()->json(['status' => 'success', 'settings' => $game->settings]);
    }

    /**
     * Lightweight Analytics for simple dashboard view
     */
    public function getAnalytics(Game $game)
    {
        $stats = DB::table('game_analytics')
            ->where('game_id', $game->id)
            ->selectRaw('
                COUNT(CASE WHEN event_type = "impression" THEN 1 END) as total_impressions,
                COUNT(CASE WHEN event_type = "start" THEN 1 END) as total_plays,
                COUNT(CASE WHEN event_type = "completion" THEN 1 END) as total_completions,
                AVG(CASE WHEN event_type = "end" THEN duration_ms END) as avg_playtime_ms
            ')
            ->first();

        $completionRate = $stats->total_plays > 0 
            ? round(($stats->total_completions / $stats->total_plays) * 100, 2) 
            : 0;

        return response()->json([
            'game_id' => $game->uuid,
            'stats' => $stats,
            'completion_rate' => $completionRate . '%'
        ]);
    }

    /**
     * Update remote configuration
     */
    public function updateConfig(Request $request, Game $game)
    {
        $request->validate(['config' => 'required|array']);
        $game->update(['config' => $request->config]);

        return response()->json([
            'status' => 'success',
            'config' => $game->config
        ]);
    }
}
