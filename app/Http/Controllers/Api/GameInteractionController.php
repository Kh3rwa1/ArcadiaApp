<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Game;
use App\Models\GameProgress;
use App\Models\Like;
use Illuminate\Http\Request;

class GameInteractionController extends Controller
{
    private function resolveGame($uuid)
    {
        return Game::where('uuid', $uuid)->firstOrFail();
    }

    public function like(Request $request, $gameUuid)
    {
        $game = $this->resolveGame($gameUuid);
        $userUuid = $request->input('user_uuid'); 

        if (!$userUuid) {
            return response()->json(['error' => 'user_uuid required'], 422);
        }

        Like::firstOrCreate([
            'game_id' => $game->id,
            'user_uuid' => $userUuid
        ]);

        return response()->json(['liked' => true, 'count' => $game->likes()->count()]);
    }

    public function unlike(Request $request, $gameUuid)
    {
        $game = $this->resolveGame($gameUuid);
        $userUuid = $request->input('user_uuid');

        if (!$userUuid) {
            return response()->json(['error' => 'user_uuid required'], 422);
        }

        Like::where('game_id', $game->id)->where('user_uuid', $userUuid)->delete();

        return response()->json(['liked' => false, 'count' => $game->likes()->count()]);
    }

    public function comments(Request $request, $gameUuid)
    {
        $game = $this->resolveGame($gameUuid);
        
        $comments = $game->comments()
            ->latest()
            ->take(50)
            ->get(['id', 'user_uuid', 'content', 'created_at']);

        return response()->json($comments);
    }

    public function addComment(Request $request, $gameUuid)
    {
        $game = $this->resolveGame($gameUuid);
        $userUuid = $request->input('user_uuid');
        $content = $request->input('content');

        if (!$userUuid || !$content) {
            return response()->json(['error' => 'user_uuid and content required'], 422);
        }

        $comment = Comment::create([
            'game_id' => $game->id,
            'user_uuid' => $userUuid,
            'content' => $content
        ]);

        return response()->json($comment, 201);
    }

    public function stats(Request $request, $gameUuid)
    {
        $game = $this->resolveGame($gameUuid);
        $userUuid = $request->input('user_uuid');

        // Active players in last 5 minutes
        $playing = GameProgress::where('game_id', $game->id)
            ->where('updated_at', '>=', now()->subMinutes(5))
            ->distinct('user_uuid')
            ->count('user_uuid');

        $isLiked = false;
        if ($userUuid) {
            $isLiked = Like::where('game_id', $game->id)->where('user_uuid', $userUuid)->exists();
        }

        return response()->json([
            'likes' => $game->likes()->count(),
            'comments' => $game->comments()->count(),
            'playing' => $playing,
            'is_liked' => $isLiked
        ]);
    }
}
