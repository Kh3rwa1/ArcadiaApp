<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GameAnalytic extends Model
{
    public $timestamps = false; // using created_at only

    protected $fillable = ['game_id', 'user_uuid', 'event_type', 'duration_ms', 'metadata'];
    protected $casts = ['metadata' => 'array'];

    public function game()
    {
        return $this->belongsTo(Game::class);
    }
}
