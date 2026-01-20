<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameProgress extends Model
{
    protected $table = 'game_progress';

    protected $fillable = [
        'user_uuid',
        'game_id',
        'current_level',
        'high_score',
        'total_score',
        'state',
        'play_count',
        'total_time_ms',
        'last_played_at',
    ];

    protected $casts = [
        'state' => 'array',
        'last_played_at' => 'datetime',
    ];

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    /**
     * Get or create progress for a user+game combination
     */
    public static function getOrCreate(string $userUuid, int $gameId): self
    {
        return self::firstOrCreate(
            ['user_uuid' => $userUuid, 'game_id' => $gameId],
            ['current_level' => 1, 'high_score' => 0, 'total_score' => 0, 'play_count' => 0, 'total_time_ms' => 0]
        );
    }

    /**
     * Update progress with new session data
     */
    public function updateFromSession(int $level, int $score, ?array $state = null, int $durationMs = 0): self
    {
        $this->current_level = max($this->current_level, $level);
        $this->high_score = max($this->high_score, $score);
        $this->total_score += $score;
        $this->play_count++;
        $this->total_time_ms += $durationMs;
        $this->last_played_at = now();

        if ($state !== null) {
            // Merge state, keeping existing keys not in new state
            $this->state = array_merge($this->state ?? [], $state);
        }

        $this->save();
        return $this;
    }
}
