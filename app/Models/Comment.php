<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    protected $fillable = ['user_uuid', 'game_id', 'content'];

    public function game()
    {
        return $this->belongsTo(Game::class);
    }
}
